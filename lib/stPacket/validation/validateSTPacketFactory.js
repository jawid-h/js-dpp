const JsonSchemaValidator = require('../../validation/JsonSchemaValidator');

const STPacket = require('../STPacket');

/**
 * @param {JsonSchemaValidator} validator
 * @param {validateSTPacketDapContracts} validateSTPacketDapContracts
 * @param {validateSTPacketDapObjects} validateSTPacketDapObjects
 * @return {validateSTPacket}
 */
module.exports = function validateSTPacketFactory(
  validator,
  validateSTPacketDapContracts,
  validateSTPacketDapObjects,
) {
  /**
   * @typedef validateSTPacket
   * @param {STPacket|Object} stPacket
   * @param {DapContract} dapContract
   * @return {ValidationResult}
   */
  function validateSTPacket(stPacket, dapContract) {
    const rawStPacket = (stPacket instanceof STPacket)
      ? stPacket.toJSON()
      : stPacket;

    const result = validator.validate(
      JsonSchemaValidator.SCHEMAS.ST_PACKET,
      rawStPacket,
    );

    if (!result.isValid()) {
      return result;
    }

    // TODO Validate itemsHashes and itemsMerkleRoot

    validateSTPacketDapContracts(rawStPacket.contracts, rawStPacket, result);

    validateSTPacketDapObjects(rawStPacket.objects, dapContract, result);

    return result;
  }

  return validateSTPacket;
};