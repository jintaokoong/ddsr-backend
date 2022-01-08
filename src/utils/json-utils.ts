const parseJSON = <T>(input: string): [SyntaxError | null, T | null] => {
  try {
    const json = JSON.parse(input);
    return [null, json];
  } catch (e: any) {
    return [e, null];
  }
};

export default {
  parseJSON,
};
