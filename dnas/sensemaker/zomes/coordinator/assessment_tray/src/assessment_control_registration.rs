use hdk::prelude::*;
use sensemaker_integrity_structs::{AssessmentControlRegistration, AssessmentControlRegistrationInput};
use nh_zome_assessment_tray_integrity::*;

#[hdk_extern]
fn register_assessment_control(registration_input: AssessmentControlRegistrationInput) -> ExternResult<Record> {
    let action_hash;

    let input: AssessmentControlRegistration = registration_input.clone().try_into()?;
    // Create entry
    action_hash = create_entry(&EntryTypes::AssessmentControlRegistration(input.clone()))?;

    let eh = hash_entry(EntryTypes::AssessmentControlRegistration(input.clone()))?;
    // Create link
    // - control registration anchor to new entry hash
    create_link(
        registrations_typed_path()?.path_entry_hash()?,
        eh.clone(),
        LinkTypes::AssessmentControlRegistration,
        (),
    )?;

    let record = get(action_hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("AssessmentControlRegistration could not be retrieved after creation".into())))?;

    // debug!("_+_+_+_+_+_+_+_+_+_ Created record: {:#?}", record);
    Ok(record)
}

#[hdk_extern]
fn get_assessment_control_registration(assessment_control_registration_eh: EntryHash) -> ExternResult<Option<Record>> {
    let maybe_registration = get(assessment_control_registration_eh, GetOptions::default())?;

    if let Some(registration_record) = maybe_registration {
        Ok(Some(registration_record))
    } else {
        Ok(None)
    }
}

#[hdk_extern]
fn get_assessment_control_registrations(_:()) -> ExternResult<Vec<Record>> {
    let links = get_links(
        registrations_typed_path()?.path_entry_hash()?,
        LinkTypes::AssessmentControlRegistration,
        None,
    )?;
    match links.last() {
        Some(_link) => {
            let collected_get_results: ExternResult<Vec<Option<Record>>> = links.into_iter().map(|link| {
                let entry_hash = link.target.into_entry_hash()
                    .ok_or_else(|| wasm_error!(WasmErrorInner::Guest(String::from("Invalid link target"))))?;

                get_assessment_control_registration(entry_hash)
            }).collect();

            // Handle the Result and then filter_map to remove None values
            collected_get_results.map(|maybe_records| {
                maybe_records.into_iter().filter_map(|maybe_record| maybe_record).collect::<Vec<Record>>()
            })
        }
        None => Ok(vec![])
    }
}

fn registrations_typed_path() -> ExternResult<TypedPath> {
    Path::from("control_registration").typed(LinkTypes::AssessmentControlRegistration)
}

#[hdk_extern]
fn delete_assessment_control_registration(action_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(action_hash)
}
