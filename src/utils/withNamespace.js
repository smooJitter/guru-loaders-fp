// Utility to help define namespaced actions in a DRY, testable way
export const withNamespace = (namespace, actions) =>
  Object.entries(actions).map(([name, methodOrObj]) => {
    if (typeof methodOrObj === 'function') {
      return { namespace, name, method: methodOrObj };
    }
    // If meta/options are provided
    const { method, ...rest } = methodOrObj;
    return { namespace, name, method, ...rest };
  }); 