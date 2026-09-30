const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const { getConfig, getDMMF, Generator } = require(path.join(root, 'node_modules/@prisma/internals'));
const { enginesVersion } = require(path.join(root, 'node_modules/@prisma/engines-version'));

async function main() {
  const schemaPath = path.join(root, 'prisma/schema.prisma');
  const datamodel = fs.readFileSync(schemaPath, 'utf8');
  const config = await getConfig({ datamodel, datamodelPath: schemaPath, cwd: root, ignoreEnvVarErrors: true });
  const dmmf = await getDMMF({ datamodel, datamodelPath: schemaPath });
  const generatorConfig = {
    ...config.generators[0],
    output: { value: path.join(root, 'node_modules/.prisma/client'), fromEnvVar: null },
  };
  const generator = new Generator(
    path.join(root, 'node_modules/@prisma/client/generator-build/index.js'),
    generatorConfig,
    true,
  );

  await generator.init();
  generator.setOptions({
    datamodel,
    datasources: config.datasources,
    generator: generatorConfig,
    dmmf,
    otherGenerators: config.generators.slice(1),
    schemaPath,
    version: enginesVersion,
    postinstall: false,
    noEngine: false,
    binaryPaths: { libqueryEngine: {} },
    allowNoModels: false,
    envPaths: { rootEnvPath: null, schemaEnvPath: undefined },
  });
  await generator.generate();
  generator.stop();

  // Prisma 5's driver-adapter client uses the WASM query engine. The generated
  // loader is aimed at bundlers and returns a namespace without a default
  // export in Node, so use the local WASM file explicitly for this runtime.
  const wasmClientPath = path.join(root, 'node_modules/.prisma/client/wasm.js');
  let wasmClient = fs.readFileSync(wasmClientPath, 'utf8');
  wasmClient = wasmClient.replace(
    /config\.engineWasm = \{[\s\S]*?\n\}/,
    `config.engineWasm = {
  getRuntime: () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const fs = require('node:fs')
    const path = require('node:path')
    return new WebAssembly.Module(fs.readFileSync(path.join(__dirname, 'query_engine_bg.wasm')))
  }
}`,
  );
  fs.writeFileSync(wasmClientPath, wasmClient);
  console.log(`Prisma client generated offline (${dmmf.datamodel.models.length} models).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
