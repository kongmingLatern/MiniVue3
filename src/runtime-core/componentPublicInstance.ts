const publicPropertiesMap = {
  $el: (i: { vnode: { el: any } }) => i.vnode.el
}
export const PublicInstanceProxyHandlers = {
  get({ _: instance }: any, key: string) {
    // setupState
    const { setupState } = instance
    if (key in setupState) {
      return setupState[key]
    }

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  }
}