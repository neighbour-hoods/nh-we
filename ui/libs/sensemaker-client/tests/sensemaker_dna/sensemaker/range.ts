
import { DnaSource, Record, ActionHash, AppBundleSource, AppEntryDef, EntryHash } from "@holochain/client";
import { cleanAllConductors, pause, runScenario } from "@holochain/tryorama";
import { EntryRecord } from "@holochain-open-dev/utils";
import { decode } from '@msgpack/msgpack';
import pkg from 'tape-promise/tape';
const { test } = pkg;

import { sensemakerDna } from "../../utils";
import { setUpAliceandBob } from "../../utils";
import { Range } from "#client";

const app_entry_def: AppEntryDef = { entry_index: 0, zome_index: 0, visibility: { Public: null } };
export default () => test("range CRUD tests", async (t) => {
  await runScenario(async scenario => {
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
    } = await setUpAliceandBob(false);

    const callZomeAlice = async (
      zome_name,
      fn_name,
      payload,
      is_ss = false
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

    try {
      await scenario.shareAllAgents();
      await pause(500);

      const tenScaleRange: Range = {
        "name": "10-scale",
        "kind": {
          "Integer": { "min": 0, "max": 10 }
        },
      };

      const twentyScaleRange: Range = {
        "name": "20-scale",
        "kind": {
          "Integer": { "min": 0, "max": 20 }
        },
      };

      // Alice creates a range
      const tenScaleRangeRecord: Record = await callZomeAlice(
        "sensemaker",
        "create_range",
        tenScaleRange,
        true
      );
      const tenScaleRangeEntryHash = new EntryRecord<Range>(tenScaleRangeRecord).entryHash;
      t.ok(tenScaleRangeEntryHash);

      const twentyScaleRangeRecord: Record = await callZomeAlice(
        "sensemaker",
        "create_range",
        twentyScaleRange,
        true
      );
      const twentyScaleRangeEntryHash = new EntryRecord<Range>(twentyScaleRangeRecord).entryHash;
      t.ok(twentyScaleRangeEntryHash);

      // Wait for the created entry to be propagated to the other node.
      await pause(100);


      // Bob gets the ten sclae range
      const tenScaleRangeReadOutput: Record = await callZomeAlice(
        "sensemaker",
        "get_range",
        tenScaleRangeEntryHash,
        true
      );
      console.log('================ tenScaleRangeReadOutput', tenScaleRangeReadOutput)
      t.deepEqual(tenScaleRange, decode((tenScaleRangeReadOutput.entry as any).Present.entry) as any);

      // Bob gets the twenty scale range
      const twentyScaleRangeOutput: Record = await callZomeAlice(
        "sensemaker",
        "get_range",
        twentyScaleRangeEntryHash,
        true
      );
      t.deepEqual(twentyScaleRange, decode((twentyScaleRangeOutput.entry as any).Present.entry) as any);

      // bob gets all ranges
      const allRangesOutput: Record[] = await callZomeAlice(
        "sensemaker",
        "get_ranges",
        null,
        true
      );

      console.log("allRangesOutput", allRangesOutput)
      t.deepEqual(allRangesOutput.length, 2);
    } catch (e) {
      console.log(e);
      t.ok(null);
    }

    await cleanup();
  });
});
