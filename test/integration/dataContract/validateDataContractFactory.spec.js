const Ajv = require('ajv');

const JsonSchemaValidator = require('../../../lib/validation/JsonSchemaValidator');

const ValidationResult = require('../../../lib/validation/ValidationResult');

const validateDataContractFactory = require('../../../lib/dataContract/validateDataContractFactory');

const getDataContractFixture = require('../../../lib/test/fixtures/getDataContractFixture');

const { expectJsonSchemaError, expectValidationError } = require('../../../lib/test/expect/expectError');

const DuplicateIndexError = require('../../../lib/errors/DuplicateIndexError');
const UndefinedIndexPropertyError = require('../../../lib/errors/UndefinedIndexPropertyError');

describe('validateDataContractFactory', () => {
  let rawDataContract;
  let validateDataContract;

  beforeEach(() => {
    rawDataContract = getDataContractFixture().toJSON();

    const ajv = new Ajv();
    const validator = new JsonSchemaValidator(ajv);

    validateDataContract = validateDataContractFactory(validator);
  });

  describe('$schema', () => {
    it('should be present', () => {
      delete rawDataContract.$schema;

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('');
      expect(error.keyword).to.equal('required');
      expect(error.params.missingProperty).to.equal('$schema');
    });

    it('should be a string', () => {
      rawDataContract.$schema = 1;

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.$schema');
      expect(error.keyword).to.equal('type');
    });

    it('should be a particular url', () => {
      rawDataContract.$schema = 'wrong';

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.keyword).to.equal('const');
      expect(error.dataPath).to.equal('.$schema');
    });
  });

  describe('contractId', () => {
    it('should be present', () => {
      delete rawDataContract.contractId;

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('');
      expect(error.keyword).to.equal('required');
      expect(error.params.missingProperty).to.equal('contractId');
    });

    it('should be a string', () => {
      rawDataContract.contractId = 1;

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.contractId');
      expect(error.keyword).to.equal('type');
    });

    it('should be no less than 64 chars', () => {
      rawDataContract.contractId = '86b273ff';

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.contractId');
      expect(error.keyword).to.equal('minLength');
    });

    it('should be no longer than 64 chars', () => {
      rawDataContract.contractId = '86b273ff86b273ff86b273ff86b273ff86b273ff86b273ff86b273ff86b273ff86b273ff86b273ff86b273ff86b273ff86b273ff';

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.contractId');
      expect(error.keyword).to.equal('maxLength');
    });
  });

  describe('version', () => {
    it('should be present', () => {
      delete rawDataContract.version;

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('');
      expect(error.keyword).to.equal('required');
      expect(error.params.missingProperty).to.equal('version');
    });

    it('should be a number', () => {
      rawDataContract.version = 'wrong';

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.version');
      expect(error.keyword).to.equal('type');
    });

    it('should be an integer', () => {
      rawDataContract.version = 1.2;

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.version');
      expect(error.keyword).to.equal('multipleOf');
    });

    it('should be greater or equal to one', () => {
      rawDataContract.version = 0;

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.version');
      expect(error.keyword).to.equal('minimum');
    });
  });

  describe('definitions', () => {
    it('may not be present', () => {
      delete rawDataContract.definitions;

      const result = validateDataContract(rawDataContract);

      expect(result).to.be.an.instanceOf(ValidationResult);
      expect(result.isValid()).to.be.true();
    });

    it('should be an object', () => {
      rawDataContract.definitions = 1;

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.definitions');
      expect(error.keyword).to.equal('type');
    });

    it('should not be empty', () => {
      rawDataContract.definitions = {};

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.definitions');
      expect(error.keyword).to.equal('minProperties');
    });

    it('should have no non-alphanumeric properties', () => {
      rawDataContract.definitions = {
        $subSchema: {},
      };

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result, 2);

      const [patternError, propertyNamesError] = result.getErrors();

      expect(patternError.dataPath).to.equal('.definitions');
      expect(patternError.keyword).to.equal('pattern');

      expect(propertyNamesError.dataPath).to.equal('.definitions');
      expect(propertyNamesError.keyword).to.equal('propertyNames');
    });

    it('should have no more than 100 properties', () => {
      rawDataContract.definitions = {};

      Array(101).fill({}).forEach((item, i) => {
        rawDataContract.definitions[i] = item;
      });

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.definitions');
      expect(error.keyword).to.equal('maxProperties');
    });

    it('should have valid property names', () => {
      const validNames = ['validName', 'valid_name', 'valid-name', 'abc', '123abc', 'abc123', 'ValidName',
        'abcdefghigklmnopqrstuvwxyz01234567890abcdefghigklmnopqrstuvwxyz', 'abc_gbf_gdb', 'abc-gbf-gdb'];

      validNames.forEach((name) => {
        rawDataContract.definitions[name] = {};

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result, 0);
      });
    });

    it('should return an invalid result if a property has invalid format', () => {
      const invalidNames = ['-invalidname', '_invalidname', 'invalidname-', 'invalidname_', '*(*&^', '$test'];

      invalidNames.forEach((name) => {
        rawDataContract.definitions[name] = {};

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result, 2);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.definitions');
        expect(error.keyword).to.equal('pattern');
      });
    });
  });

  describe('documents', () => {
    it('should be present', () => {
      delete rawDataContract.documents;

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('');
      expect(error.keyword).to.equal('required');
      expect(error.params.missingProperty).to.equal('documents');
    });

    it('should be an object', () => {
      rawDataContract.documents = 1;

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.documents');
      expect(error.keyword).to.equal('type');
    });

    it('should not be empty', () => {
      rawDataContract.documents = {};

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.documents');
      expect(error.keyword).to.equal('minProperties');
    });

    it('should have valid property names', () => {
      const validNames = ['validName', 'valid_name', 'valid-name', 'abc', '123abc', 'abc123', 'ValidName', 'validName',
        'abcdefghigklmnopqrstuvwxyz01234567890abcdefghigklmnopqrstuvwxyz', 'abc_gbf_gdb', 'abc-gbf-gdb'];

      validNames.forEach((name) => {
        rawDataContract.documents[name] = rawDataContract.documents.niceDocument;

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result, 0);
      });
    });

    it('should return an invalid result if a property has invalid format', () => {
      const invalidNames = ['-invalidname', '_invalidname', 'invalidname-', 'invalidname_', '*(*&^', '$test'];

      invalidNames.forEach((name) => {
        rawDataContract.documents[name] = rawDataContract.documents.niceDocument;

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.documents');
        expect(error.keyword).to.equal('additionalProperties');
      });
    });

    it('should have no more than 100 properties', () => {
      const niceDocumentDefinition = rawDataContract.documents.niceDocument;

      rawDataContract.documents = {};

      Array(101).fill(niceDocumentDefinition).forEach((item, i) => {
        rawDataContract.documents[i] = item;
      });

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.documents');
      expect(error.keyword).to.equal('maxProperties');
    });

    describe('Document schema', () => {
      it('should not be empty', () => {
        rawDataContract.documents.niceDocument.properties = {};

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.documents[\'niceDocument\'].properties');
        expect(error.keyword).to.equal('minProperties');
      });

      it('should have type "object" if defined', () => {
        delete rawDataContract.documents.niceDocument.properties;

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.documents[\'niceDocument\']');
        expect(error.keyword).to.equal('required');
        expect(error.params.missingProperty).to.equal('properties');
      });

      it('should have "properties"', () => {
        delete rawDataContract.documents.niceDocument.properties;

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.documents[\'niceDocument\']');
        expect(error.keyword).to.equal('required');
        expect(error.params.missingProperty).to.equal('properties');
      });

      it('should have valid property names', () => {
        const validNames = ['validName', 'valid_name', 'valid-name', 'abc', '123abc', 'abc123', 'ValidName', 'validName',
          'abcdefghigklmnopqrstuvwxyz01234567890abcdefghigklmnopqrstuvwxyz', 'abc_gbf_gdb', 'abc-gbf-gdb'];

        validNames.forEach((name) => {
          rawDataContract.documents.niceDocument.properties[name] = {};

          const result = validateDataContract(rawDataContract);

          expectJsonSchemaError(result, 0);
        });
      });

      it('should return an invalid result if a property has invalid format', () => {
        const invalidNames = ['-invalidname', '_invalidname', 'invalidname-', 'invalidname_', '*(*&^', '$test'];

        invalidNames.forEach((name) => {
          rawDataContract.documents.niceDocument.properties[name] = {};

          const result = validateDataContract(rawDataContract);

          expectJsonSchemaError(result, 2);

          const errors = result.getErrors();

          expect(errors[0].dataPath).to.equal('.documents[\'niceDocument\'].properties');
          expect(errors[0].keyword).to.equal('pattern');
          expect(errors[1].dataPath).to.equal('.documents[\'niceDocument\'].properties');
          expect(errors[1].keyword).to.equal('propertyNames');
        });
      });

      it('should have "additionalProperties" defined', () => {
        delete rawDataContract.documents.niceDocument.additionalProperties;

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.documents[\'niceDocument\']');
        expect(error.keyword).to.equal('required');
        expect(error.params.missingProperty).to.equal('additionalProperties');
      });

      it('should have "additionalProperties" defined to false', () => {
        rawDataContract.documents.niceDocument.additionalProperties = true;

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.documents[\'niceDocument\'].additionalProperties');
        expect(error.keyword).to.equal('const');
      });

      it('should have no more than 100 properties', () => {
        const propertyDefinition = { };

        rawDataContract.documents.niceDocument.properties = {};

        Array(101).fill(propertyDefinition).forEach((item, i) => {
          rawDataContract.documents.niceDocument.properties[i] = item;
        });

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.documents[\'niceDocument\'].properties');
        expect(error.keyword).to.equal('maxProperties');
      });
    });
  });

  describe('indices', () => {
    it('should be an array', () => {
      rawDataContract.documents.indexedDocument.indices = 'definitely not an array';

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.documents[\'indexedDocument\'].indices');
      expect(error.keyword).to.equal('type');
    });

    it('should have at least one item', () => {
      rawDataContract.documents.indexedDocument.indices = [];

      const result = validateDataContract(rawDataContract);

      expectJsonSchemaError(result);

      const [error] = result.getErrors();

      expect(error.dataPath).to.equal('.documents[\'indexedDocument\'].indices');
      expect(error.keyword).to.equal('minItems');
    });

    describe('index', () => {
      it('should be an object', () => {
        rawDataContract.documents.indexedDocument.indices = ['something else'];

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.documents[\'indexedDocument\'].indices[0]');
        expect(error.keyword).to.equal('type');
      });

      it('should have properties definition', () => {
        rawDataContract.documents.indexedDocument.indices = [{}];

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.documents[\'indexedDocument\'].indices[0]');
        expect(error.params.missingProperty).to.equal('properties');
        expect(error.keyword).to.equal('required');
      });

      describe('properties definition', () => {
        it('should be an array', () => {
          rawDataContract.documents.indexedDocument.indices[0]
            .properties = 'something else';

          const result = validateDataContract(rawDataContract);

          expectJsonSchemaError(result);

          const [error] = result.getErrors();

          expect(error.dataPath).to.equal(
            '.documents[\'indexedDocument\'].indices[0].properties',
          );
          expect(error.keyword).to.equal('type');
        });

        it('should have at least one property defined', () => {
          rawDataContract.documents.indexedDocument.indices[0]
            .properties = [];

          const result = validateDataContract(rawDataContract);

          expectJsonSchemaError(result);

          const [error] = result.getErrors();

          expect(error.dataPath).to.equal(
            '.documents[\'indexedDocument\'].indices[0].properties',
          );
          expect(error.keyword).to.equal('minItems');
        });

        it('should have no more than 100 property definitions', () => {
          for (let i = 0; i < 100; i++) {
            rawDataContract.documents.indexedDocument.indices[0]
              .properties.push({
                [`field${i}`]: 'asc',
              });
          }

          const result = validateDataContract(rawDataContract);

          expectJsonSchemaError(result);

          const [error] = result.getErrors();

          expect(error.dataPath).to.equal(
            '.documents[\'indexedDocument\'].indices[0].properties',
          );
          expect(error.keyword).to.equal('maxItems');
        });

        describe('property definition', () => {
          it('should be an object', () => {
            rawDataContract.documents.indexedDocument.indices[0]
              .properties[0] = 'something else';

            const result = validateDataContract(rawDataContract);

            expectJsonSchemaError(result);

            const [error] = result.getErrors();

            expect(error.dataPath).to.equal(
              '.documents[\'indexedDocument\'].indices[0].properties[0]',
            );
            expect(error.keyword).to.equal('type');
          });

          it('should have at least one property', () => {
            rawDataContract.documents.indexedDocument.indices[0]
              .properties = [];

            const result = validateDataContract(rawDataContract);

            expectJsonSchemaError(result);

            const [error] = result.getErrors();

            expect(error.dataPath).to.equal(
              '.documents[\'indexedDocument\'].indices[0].properties',
            );
            expect(error.keyword).to.equal('minItems');
          });

          it('should have no more than one property', () => {
            const property = rawDataContract.documents.indexedDocument.indices[0]
              .properties[0];

            property.anotherField = 'something';

            const result = validateDataContract(rawDataContract);

            expectJsonSchemaError(result);

            const [error] = result.getErrors();

            expect(error.dataPath).to.equal(
              '.documents[\'indexedDocument\'].indices[0].properties[0]',
            );
            expect(error.keyword).to.equal('maxProperties');
          });

          it('should have property values only "asc" or "desc"', () => {
            rawDataContract.documents.indexedDocument.indices[0]
              .properties[0].$userId = 'wrong';

            const result = validateDataContract(rawDataContract);

            expectJsonSchemaError(result);

            const [error] = result.getErrors();

            expect(error.dataPath).to.equal(
              '.documents[\'indexedDocument\'].indices[0].properties[0][\'$userId\']',
            );
            expect(error.keyword).to.equal('enum');
          });
        });
      });

      it('should have "unique" flag to be of a boolean type', () => {
        rawDataContract.documents.indexedDocument.indices[0].unique = 12;

        const result = validateDataContract(rawDataContract);

        expectJsonSchemaError(result);

        const [error] = result.getErrors();

        expect(error.dataPath).to.equal('.documents[\'indexedDocument\'].indices[0].unique');
        expect(error.keyword).to.equal('type');
      });
    });
  });

  it('should return invalid result if there are additional properties', () => {
    rawDataContract.additionalProperty = { };

    const result = validateDataContract(rawDataContract);

    expectJsonSchemaError(result);

    const [error] = result.getErrors();

    expect(error.dataPath).to.equal('');
    expect(error.keyword).to.equal('additionalProperties');
  });

  it('should return invalid result if there are duplicated indices', () => {
    const indexDefinition = Object.assign({},
      rawDataContract.documents.indexedDocument.indices[0]);

    rawDataContract.documents.indexedDocument.indices.push(indexDefinition);

    const result = validateDataContract(rawDataContract);

    expectValidationError(result, DuplicateIndexError);

    const [error] = result.getErrors();

    expect(error.getIndexDefinition()).to.deep.equal(indexDefinition);
    expect(error.getRawDataContract()).to.deep.equal(rawDataContract);
    expect(error.getDocumentType()).to.deep.equal('indexedDocument');
  });

  it('should return invalid result if indices has undefined property', () => {
    const indexDefinition = rawDataContract.documents.indexedDocument.indices[0];

    indexDefinition.properties.push({
      missingProperty: 'asc',
    });

    const result = validateDataContract(rawDataContract);

    expectValidationError(result, UndefinedIndexPropertyError);

    const [error] = result.getErrors();

    expect(error.getPropertyName()).to.equal('missingProperty');
    expect(error.getRawDataContract()).to.deep.equal(rawDataContract);
    expect(error.getDocumentType()).to.deep.equal('indexedDocument');
    expect(error.getIndexDefinition()).to.deep.equal(indexDefinition);
  });

  it('should return valid result if Data Contract is valid', () => {
    const result = validateDataContract(rawDataContract);

    expect(result).to.be.an.instanceOf(ValidationResult);
    expect(result.isValid()).to.be.true();
  });
});
