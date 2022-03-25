export const extend = Object.assign

export const isObject = (val: any) => {
  return val !== null && typeof val === "object"
};

export const hasChanged = (oldVal: any, newVal: any) => {
  return !Object.is(oldVal, newVal)
};
