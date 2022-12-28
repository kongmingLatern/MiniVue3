// mini-vue 出口
export * from '@mini-vue3/runtime-dom'
export * from '@mini-vue3/reactivity'
import { baseCompile } from '@mini-vue3/compiler-core';
import * as runtimeDom from '@mini-vue3/runtime-dom'
import { registerRuntimeCompiler } from '@mini-vue3/runtime-core';

function compileToFunction(template) {
  const { code } = baseCompile(template)
  const render = new Function("Vue", code)(runtimeDom)

  return render
}

registerRuntimeCompiler(compileToFunction)
