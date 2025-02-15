import { Action, AppEntryDef, Create, EntryHash, Record, encodeHashToBase64, fakeEntryHash } from "@holochain/client";
import { cleanAllConductors, pause, runScenario } from "@holochain/tryorama";
import {
  AppletConfig,
  AppletConfigInput,
  ConfigCulturalContext,
  ConfigMethod,
  ConfigResourceDef,
  ConfigThreshold,
  CulturalContext,
  Dimension,
  Method,
  Range,
  ResourceDef,
  Threshold
} from "#client";
import pkg from "tape-promise/tape";

import { setUpAliceandBob } from "../../utils";
import { EntryRecord } from "@holochain-open-dev/utils";
const { test } = pkg;

const app_entry_def: AppEntryDef = { entry_index: 0, zome_index: 0, visibility: { Public: null } };
export default () =>
    test("test Sensemaker Configuration", async (t) => {
        await runScenario(async (scenario) => {
            const {
              alice,
              bob,
              cleanup,
              alice_agent_key,
              bob_agent_key,
              ss_cell_id_alice,
              ss_cell_id_bob,
              provider_cell_id_alice,
              provider_cell_id_bob,
            } = await setUpAliceandBob();
      
            const callZomeAlice = async (
              zome_name,
              fn_name,
              payload,
              is_ss = true
            ) => {
              return await alice.callZome({
                cap_secret: null,
                cell_id: is_ss ? ss_cell_id_alice : provider_cell_id_alice,
                zome_name,
                fn_name,
                payload,
                provenance: alice_agent_key,
              });
            };
            const callZomeBob = async (zome_name, fn_name, payload, is_ss = true) => {
              return await bob.callZome({
                cap_secret: null,
                cell_id: is_ss ? ss_cell_id_bob : provider_cell_id_bob,
                zome_name,
                fn_name,
                payload,
                provenance: bob_agent_key,
              });
            };
            const pauseDuration = 1000;
            try {
              await scenario.shareAllAgents();
              await pause(pauseDuration);

                const applet_eh = await fakeEntryHash()

                const integerRange: Range = {
                    "name": "1-scale",
                    "kind": {
                        "Integer": { "min": 0, "max": 1 }
                    },
                };

                const rangeRecord: Record = await callZomeAlice(
                    "sensemaker",
                    "create_range",
                    integerRange,
                    true
                );
                const rangeHash = new EntryRecord<Range>(rangeRecord).entryHash;

                t.ok(rangeHash);

                const dimensionName = "importance"
                const dimension: Dimension = {
                    name: dimensionName,
                    range_eh: rangeHash,
                    computed: false,
                }

                const configDimension = {
                    name: dimensionName,
                    range: integerRange,
                    computed: false,
                }

                const dimensionRecord: Record = await callZomeAlice(
                    "sensemaker",
                    "create_dimension",
                    dimension,
                    true
                );
                const dimensionHash = new EntryRecord<Dimension>(dimensionRecord).entryHash;
                t.ok(dimensionHash);
                console.log('dimension hash', dimensionHash)

                const integerRange2: Range = {
                    name: "1-scale-total",
                    kind: {
                        Integer: { min: 0, max: 1000000 },
                    },
                };

                const rangeRecord2: Record = await callZomeAlice(
                    "sensemaker",
                    "create_range",
                    integerRange2,
                    true
                );
                const rangeHash2 = new EntryRecord<Range>(rangeRecord2).entryHash;

                const objectiveDimension: Dimension = {
                    name: "total_importance",
                    range_eh: rangeHash2,
                    computed: true,
                };

                const configObjectiveDimension = {
                    name: "total_importance",
                    range: integerRange2,
                    computed: true,
                }

                const objectiveDimensionRecord: Record = await callZomeAlice(
                    "sensemaker",
                    "create_dimension",
                    objectiveDimension,
                    true
                );
                const objectiveDimensionHash = new EntryRecord<Dimension>(objectiveDimensionRecord).entryHash;
                t.ok(objectiveDimensionHash);

                let app_entry_def: AppEntryDef = { entry_index: 0, zome_index: 0, visibility: { Public: null } };
                // waiting for sensemaker-lite-types to be updated
                // const resourceDef: ResourceDef = {
                const resourceDef: ResourceDef = {
                    resource_name: "task_item",
                    applet_eh,
                    base_types: [app_entry_def],
                    role_name: "test_provider_dna",
                    zome_name: "test_provider",
                }

                // waiting for sensemaker-lite-types to be updated
                // const configResourceDef: ConfigResourceDef = {
                const configResourceDef: ConfigResourceDef = {
                    resource_name: resourceDef.resource_name,
                    applet_eh,
                    base_types: resourceDef.base_types,
                    role_name: resourceDef.role_name,
                    zome_name: resourceDef.zome_name,
                }

                const resourceDefRecord: Record = await callZomeAlice(
                    "sensemaker",
                    "create_resource_def",
                    resourceDef,
                    true
                );
                const resourceDefEh = new EntryRecord<ConfigResourceDef>(resourceDefRecord).entryHash;
                t.ok(resourceDefEh);

                const methodName = "total_importance_method"
                const totalImportanceMethod: Method = {
                    name: methodName,
                    input_dimension_ehs: [dimensionHash],
                    output_dimension_eh: objectiveDimensionHash,
                    program: { Sum: null },
                    can_compute_live: false,
                    requires_validation: false,
                };

                const configMethod: ConfigMethod = {
                    name: totalImportanceMethod.name,
                    input_dimensions: [configDimension], // check if it's subjective (for now)
                    output_dimension: configObjectiveDimension,      // check if it's objective
                    program: totalImportanceMethod.program,                 // making enum for now, in design doc it is `AST`
                    can_compute_live: totalImportanceMethod.can_compute_live,
                    requires_validation: totalImportanceMethod.requires_validation,
                }

                const methodRecord: Record = await callZomeAlice(
                    "sensemaker",
                    "create_method",
                    totalImportanceMethod,
                    true
                );
                const methodEh = new EntryRecord<Method>(methodRecord).entryHash;
                t.ok(methodEh);
                const threshold: Threshold = {
                    dimension_eh: objectiveDimensionHash,
                    kind: { GreaterThan: null },
                    value: { Integer: 0 },
                };

                const configThreshold: ConfigThreshold = {
                    dimension: configObjectiveDimension,
                    kind: { GreaterThan: null },
                    value: { Integer: 0 },
                };

                const culturalContext: CulturalContext = {
                    name: "most_important_tasks",
                    resource_def_eh: resourceDefEh,
                    thresholds: [threshold],
                    order_by: [[objectiveDimensionHash, { Biggest: null }]], // DimensionEh
                };

                const configCulturalContext: ConfigCulturalContext = {
                    name: culturalContext.name,
                    resource_def: configResourceDef,
                    thresholds: [configThreshold],
                    order_by: [[configObjectiveDimension, { Biggest: null }]], // DimensionEh
                }

                const contextRecord: Record = await callZomeAlice(
                    "sensemaker",
                    "create_cultural_context",
                    culturalContext,
                    true
                );
                const contextEh = new EntryRecord<CulturalContext>(contextRecord).entryHash;
                t.ok(contextEh);

                // create a config type
                const appletConfig: AppletConfig = {
                    name: "todo",
                    applet_eh,
                    ranges: {
                        "1-scale": rangeHash,
                        "1-scale-total": rangeHash2

                    },
                    dimensions: {
                        importance: dimensionHash,
                        total_importance: objectiveDimensionHash
                    },
                    resource_defs: { task_item: resourceDefEh },
                    methods: { total_importance_method: methodEh },
                    cultural_contexts: { most_important_tasks: contextEh },
                }

                const appletConfigInput: AppletConfigInput = {
                    name: appletConfig.name,
                    applet_eh,
                    ranges: [integerRange, integerRange2],
                    dimensions: [configDimension, configObjectiveDimension],
                    resource_defs: [configResourceDef],
                    methods: [configMethod],
                    cultural_contexts: [configCulturalContext],
                }

                let maybeAppletConfig: any = await callZomeAlice(
                    "sensemaker",
                    "check_if_applet_config_exists",
                    appletConfigInput.name,
                    true
                );
                t.ok(!maybeAppletConfig);

                const returnedAppletConfig: any = await callZomeAlice(
                    "sensemaker",
                    "register_applet",
                    appletConfigInput,
                    true
                );
                t.ok(returnedAppletConfig);

                // We cannot do a serialised comparison as we need to test that config dimensions don't get created
                // If we test the entry hashes (Object.values of each hash map) then we know the entries are the same
                t.equal(returnedAppletConfig.name, appletConfig.name);
                t.equal(encodeHashToBase64(returnedAppletConfig.applet_eh), encodeHashToBase64(appletConfig.applet_eh));
                t.deepEqual(Object.values(returnedAppletConfig.ranges).map(hash => encodeHashToBase64(hash as Uint8Array)), Object.values(appletConfig.ranges).map(hash => encodeHashToBase64(hash as Uint8Array)));
                t.equal(Object.values(returnedAppletConfig.dimensions).length, 0); // Dimensions are no longer created from config
                t.deepEqual(Object.values(returnedAppletConfig.resource_defs).map(hash => encodeHashToBase64(hash as Uint8Array)), Object.values(appletConfig.resource_defs).map(hash => encodeHashToBase64(hash as Uint8Array)));
                t.deepEqual(Object.values(returnedAppletConfig.methods).map(hash => encodeHashToBase64(hash as Uint8Array)), Object.values(appletConfig.methods).map(hash => encodeHashToBase64(hash as Uint8Array)));
                t.deepEqual(Object.values(returnedAppletConfig.cultural_contexts).map(hash => encodeHashToBase64(hash as Uint8Array)), Object.values(appletConfig.cultural_contexts).map(hash => encodeHashToBase64(hash as Uint8Array)));

                maybeAppletConfig = await callZomeAlice(
                    "sensemaker",
                    "check_if_applet_config_exists",
                    appletConfigInput.name,
                    true
                );
                t.ok(maybeAppletConfig);
                
                // We cannot do a serialised comparison as we need to test that config dimensions don't get created
                // If we test the entry hashes (Object.values of each hash map) then we know the entries are the same
                t.equal(maybeAppletConfig.name, appletConfig.name);
                t.equal(encodeHashToBase64(maybeAppletConfig.applet_eh), encodeHashToBase64(appletConfig.applet_eh));
                t.deepEqual(Object.values(maybeAppletConfig.ranges).map(hash => encodeHashToBase64(hash as Uint8Array)), Object.values(appletConfig.ranges).map(hash => encodeHashToBase64(hash as Uint8Array)));
                t.equal(Object.values(maybeAppletConfig.dimensions).length, 0); // Dimensions are no longer created from config
                t.deepEqual(Object.values(maybeAppletConfig.resource_defs).map(hash => encodeHashToBase64(hash as Uint8Array)), Object.values(appletConfig.resource_defs).map(hash => encodeHashToBase64(hash as Uint8Array)));
                t.deepEqual(Object.values(maybeAppletConfig.methods).map(hash => encodeHashToBase64(hash as Uint8Array)), Object.values(appletConfig.methods).map(hash => encodeHashToBase64(hash as Uint8Array)));
                t.deepEqual(Object.values(maybeAppletConfig.cultural_contexts).map(hash => encodeHashToBase64(hash as Uint8Array)), Object.values(appletConfig.cultural_contexts).map(hash => encodeHashToBase64(hash as Uint8Array)));
            } catch (e) {
                console.log(e);
                t.ok(null);
            }

            await cleanup();
        });
    });
