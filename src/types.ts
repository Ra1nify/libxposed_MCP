export interface ApiConstant {
  name: string;
  type: string;
  value: string;
  doc: string;
}

export interface ApiMethod {
  name: string;
  signature: string;
  returnType?: string;
  params?: string[];
  sinceApi?: number;
  doc: string;
}

export interface ApiClass {
  name: string;
  type: string;
  sinceApi: number;
  summary: string;
  javadocUrl?: string;
  constants?: ApiConstant[];
  methods?: ApiMethod[];
}

export interface ApiModuleData {
  module: string;
  version: string;
  description: string;
  javadocBaseUrl: string;
  classes: ApiClass[];
}

export interface HelperComponent {
  name: string;
  type: string;
  summary: string;
  methods?: ApiMethod[];
  patterns?: { title: string; code: string }[];
}

export interface HelperModuleData {
  module: string;
  version: string;
  description: string;
  components: HelperComponent[];
}

export interface ServiceModuleData {
  module: string;
  version: string;
  description: string;
  components: {
    name: string;
    type: string;
    summary: string;
    features?: string[];
    usage?: { title: string; code: string }[];
    interfaces?: { name: string; doc: string }[];
  }[];
}

export interface LintModuleData {
  module: string;
  version: string;
  description: string;
  annotations: { name: string; target: string[]; doc: string }[];
  apiLevels: { version: number; name: string; features: string[] }[];
}

export interface ExampleModuleData {
  module: string;
  version: string;
  description: string;
  templates: {
    build_gradle_kts: string;
    proguard_rules: string;
    manifest_xml: string;
    java_init_list: string;
    java_module_example: string;
    kotlin_module_example: string;
  };
}

export interface MigrationMapping {
  legacy: string;
  modern: string;
  notes: string;
}

export interface MigrationModuleData {
  module: string;
  version: string;
  description: string;
  mappings: MigrationMapping[];
  migrationExample: {
    before: string;
    after: string;
  };
}
