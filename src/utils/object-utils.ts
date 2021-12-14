const getKeys = <T>(obj: T) => Object.keys(obj) as Array<keyof T>;

export default {
  getKeys,
};
