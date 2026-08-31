import type { GeneratorDefinition } from './types'

class GeneratorRegistry {
  private map = new Map<string, GeneratorDefinition>()

  register(def: GeneratorDefinition) {
    this.map.set(def.id, def)
  }

  get(id: string): GeneratorDefinition | undefined {
    return this.map.get(id)
  }

  all(): GeneratorDefinition[] {
    return Array.from(this.map.values())
  }

  byCategory(category: GeneratorDefinition['category']): GeneratorDefinition[] {
    return this.all().filter((g) => g.category === category)
  }
}

export const generatorRegistry = new GeneratorRegistry()
