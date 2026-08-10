import type { AnalyzerPlugin } from "../contracts/AnalyzerPlugin";

export class PluginRegistry {

    private readonly plugins: AnalyzerPlugin[] = [];

    register(plugin: AnalyzerPlugin): void {
        this.plugins.push(plugin);
    }

    getAll(): AnalyzerPlugin[] {
        return [...this.plugins];
    }

    getById(id: string): AnalyzerPlugin | undefined {
        return this.plugins.find(plugin => plugin.id === id);
    }

}
