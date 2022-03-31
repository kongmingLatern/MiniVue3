export const extend = Object.assign

export const isObject = (val: any) => {
  return val !== null && typeof val === "object"
};

export const hasChanged = (oldVal: any, newVal: any) => {
  return !Object.is(oldVal, newVal)
};

// add -> Add
const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Add -> onAdd
export const toHandlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : ""
}

// add-foo -> addFoo
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, char: string) => {
    return char ? char.toUpperCase() : ""
  })
}