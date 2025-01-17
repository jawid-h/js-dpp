const DataTrigger = require('../../../lib/dataTrigger/DataTrigger');
const DataTriggerExecutionContext = require('../../../lib/dataTrigger/DataTriggerExecutionContext');
const getDpnsContractFixture = require('../../../lib/test/fixtures/getDpnsContractFixture');
const DataTriggerExecutionResult = require('../../../lib/dataTrigger/DataTriggerExecutionResult');
const getDocumentsFixture = require('../../../lib/test/fixtures/getDocumentsFixture');
const DataTriggerExecutionError = require('../../../lib/errors/DataTriggerExecutionError');
const DataTriggerInvalidResultError = require('../../../lib/errors/DataTriggerInvalidResultError');

describe('DataTrigger', () => {
  let dataContractMock;
  let context;
  let triggerStub;
  let document;

  beforeEach(function beforeEach() {
    triggerStub = this.sinonSandbox.stub().resolves(new DataTriggerExecutionResult());
    dataContractMock = getDpnsContractFixture();

    ([document] = getDocumentsFixture());

    context = new DataTriggerExecutionContext(
      null,
      '6b74011f5d2ad1a8d45b71b9702f54205ce75253593c3cfbba3fdadeca278288',
      dataContractMock,
    );
  });

  it('should check trigger fields', () => {
    const trigger = new DataTrigger(
      dataContractMock.getId(),
      document.getType(),
      document.getAction(),
      triggerStub,
    );

    expect(trigger.dataContractId).to.equal(dataContractMock.getId());
    expect(trigger.documentType).to.equal(document.getType());
    expect(trigger.documentAction).to.equal(document.getAction());
    expect(trigger.trigger).to.equal(triggerStub);
  });

  describe('#execute', () => {
    it('should check trigger execution', async () => {
      const trigger = new DataTrigger(
        dataContractMock.getId(),
        document.getType(),
        document.getAction(),
        triggerStub,
      );

      const result = await trigger.execute(context);

      expect(result).to.be.instanceOf(DataTriggerExecutionResult);
    });

    it('should pass through the result of the trigger function', async () => {
      const functionResult = new DataTriggerExecutionResult();

      const triggerError = new Error('Trigger error');

      functionResult.addError(triggerError);

      triggerStub.resolves(functionResult);

      const trigger = new DataTrigger(
        dataContractMock.getId(),
        document.getType(),
        document.getAction(),
        triggerStub,
      );

      const result = await trigger.execute(document, context);

      expect(result).to.deep.equal(functionResult);
      expect(result.getErrors()[0]).to.deep.equal(triggerError);
    });

    it('should return a result with execution error if trigger function have thrown an error', async () => {
      const triggerError = new Error('Trigger error');

      triggerStub.throws(triggerError);

      const trigger = new DataTrigger(
        dataContractMock.getId(),
        document.getType(),
        document.getAction(),
        triggerStub,
      );

      const result = await trigger.execute(context);

      expect(result).to.be.an.instanceOf(DataTriggerExecutionResult);
      expect(result.getErrors()[0]).to.be.an.instanceOf(DataTriggerExecutionError);
      expect(result.getErrors()[0].getError()).to.equal(triggerError);
    });

    it('should return a result with invalid result error if trigger function have not returned any result', async () => {
      triggerStub.resolves(null);

      const trigger = new DataTrigger(
        dataContractMock.getId(),
        document.getType(),
        document.getAction(),
        triggerStub,
      );

      const result = await trigger.execute(context);

      expect(result).to.be.an.instanceOf(DataTriggerExecutionResult);
      expect(result.getErrors()[0]).to.be.an.instanceOf(DataTriggerInvalidResultError);
      expect(result.getErrors()[0].message).to.equal('Data trigger have not returned any result');
    });
  });
});
