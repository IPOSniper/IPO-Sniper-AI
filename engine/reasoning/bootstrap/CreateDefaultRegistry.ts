import { PluginRegistry } from "../builders/PluginRegistry";
import { BusinessFundamentalsPlugin } from "../plugins/BusinessFundamentalsPlugin";

export function createDefaultRegistry(): PluginRegistry {

    const registry = new PluginRegistry();

    registry.register(
        new BusinessFundamentalsPlugin()
    );

    return registry;

}
