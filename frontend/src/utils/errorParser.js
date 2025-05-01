export const parseContractError = (error, contract) => {
    if (error.data && contract) {
      try {
        const errorFragment = contract.interface.parseError(error.data);
        return errorFragment.name;
      } catch (e) {
        console.warn("Could not parse error data:", e);
      }
    }
    return error.reason || error.message;
  };