import { AppAgentWebsocket, CellId } from "@holochain/client";
import { NeighbourhoodInfo } from "@neighbourhoods/client";

export class WeGroupService {
  constructor(public client: AppAgentWebsocket, protected cellId: CellId, protected zomeName = "we_coordinator") {}

  async getInfo(): Promise<NeighbourhoodInfo> {
    return this.client.callZome({
      cell_id: this.cellId,
      zome_name: "we",
      fn_name: "get_info",
      payload: null
    });
  }

  private callZome(fn_name: string, payload: any) {
    return this.client.callZome({
      cell_id: this.cellId,
      zome_name: this.zomeName,
      fn_name,
      payload
  });
  }
}
