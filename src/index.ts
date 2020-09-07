import { envConstructorOptions } from "./types/env";

interface envInterface {
  loadDefaults(filePath: string): Promise<void>;
  getString(name: string, defaultValue: string): string;
  getInt(name: string, defaultValue: number): number;
  getFloat(name: string, defaultValue: number): number;
  getArray(name: string, defaultValue: any[]): any[];
}

export default class env implements envInterface {
  private prefixSeparate: string = "_";
  private prefix: string = "";
  private defaults: object = {};

  constructor(options?: envConstructorOptions) {
    if (!options) return;
    for (let option in options) {
      this[option] = options[option];
    }
  }

  private getEnvironmentVariable(name: string): string {
    const prefix = `${this.prefix}${this.prefixSeparate}`;
    if (prefix !== this.prefixSeparate) {
      name = `${prefix}${name}`;
    }

    if (this.defaults[name]) {
      return this.defaults[name];
    }

    if (process.env[name] !== undefined) {
      return process.env[name];
    }
    return null;
  }

  private getTypedEnvironmenVariable(
    name: string,
    defaultValue: any,
    type: string
  ): any {
    let variable: any = this.getEnvironmentVariable(name);
    if (!variable) {
      variable = defaultValue;
    }

    if (!variable) {
      return null;
    }

    let parsed: any;

    switch (type) {
      case "string":
        return String(variable);
      case "int":
        parsed = parseInt(variable);
        if (isNaN(parsed)) return this.typeConersionError();
        break;
      case "float":
        parsed = parseFloat(variable);
        if (isNaN(parsed)) return this.typeConersionError();
        break;
      case "array":
        if (Array.isArray(variable)) {
          parsed = variable;
        } else {
          try {
            parsed = JSON.parse(variable);
          } catch (e) {
            console.log(typeof variable);
            parsed = variable.split(",");
          }
        }
        break;
    }

    return parsed;
  }

  private typeConersionError() {
    throw new Error("Cannot convert types error");
  }

  private moduleNotFoundError() {
    throw new Error("Cannot find Module");
  }

  private moduleStructureWrongError() {
    throw new Error("Module Structure wrong");
  }

  private moduleEmptyError() {
    throw new Error("Module has no Keys");
  }

  public async loadDefaults(filePath: string): Promise<void> {
    let defaults: any;
    try {
      defaults = await import(filePath);
    } catch (e) {
      return this.moduleNotFoundError();
    }

    if (!defaults.hasOwnProperty("defaults")) {
      return this.moduleStructureWrongError();
    }

    if (Object.keys(defaults.defaults).length === 0) {
      return this.moduleEmptyError();
    }

    this.defaults = defaults.defaults;
  }

  public getString(name: string, defaultValue?: string): string {
    return this.getTypedEnvironmenVariable(name, defaultValue, "string");
  }

  public getInt(name: string, defaultValue?: number): number {
    return this.getTypedEnvironmenVariable(name, defaultValue, "int");
  }

  public getFloat(name: string, defaultValue?: number): number {
    return this.getTypedEnvironmenVariable(name, defaultValue, "float");
  }

  public getArray(name: string, defaultValue?: any[]): any[] {
    return this.getTypedEnvironmenVariable(name, defaultValue, "array");
  }
}
