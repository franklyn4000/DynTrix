class ConfigController {
  config = null;

  constructor() {
  }

  async loadConfig(path) {
    this.config = await d3.json(path);
  }

  get config() {
    return this.config;
  }

  set config(value) {
    this.config = value;
  }
}
