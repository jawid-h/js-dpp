const getDataTriggersFactory = require('../../../lib/dataTrigger/getDataTriggersFactory');

const { getChildDocumentFixture } = require('../../../lib/test/fixtures/getDpnsDocumentFixture');

const Document = require('../../../lib/document/Document');
const DataTrigger = require('../../../lib/dataTrigger/DataTrigger');

const createDomainDataTrigger = require('../../../lib/dataTrigger/dpnsTriggers/createDomainDataTrigger');
const updateDomainDataTrigger = require('../../../lib/dataTrigger/dpnsTriggers/updateDomainDataTrigger');
const deleteDomainDataTrigger = require('../../../lib/dataTrigger/dpnsTriggers/deleteDomainDataTrigger');


describe('getDataTriggers', () => {
  let getDataTriggers;

  let createDocument;
  let updateDocument;
  let deleteDocument;

  let createTrigger;
  let updateTrigger;
  let deleteTrigger;

  let dataContractId;

  beforeEach(function beforeEach() {
    createDocument = getChildDocumentFixture();
    createDocument.setAction(Document.ACTIONS.CREATE);

    updateDocument = getChildDocumentFixture();
    updateDocument.setAction(Document.ACTIONS.REPLACE);

    deleteDocument = getChildDocumentFixture();
    deleteDocument.data = {};
    deleteDocument.setAction(Document.ACTIONS.DELETE);

    dataContractId = 'someContractId';

    createTrigger = new DataTrigger(
      dataContractId, 'domain', Document.ACTIONS.CREATE, createDomainDataTrigger,
    );
    updateTrigger = new DataTrigger(
      dataContractId, 'domain', Document.ACTIONS.REPLACE, updateDomainDataTrigger,
    );
    deleteTrigger = new DataTrigger(
      dataContractId, 'domain', Document.ACTIONS.DELETE, deleteDomainDataTrigger,
    );

    this.sinonSandbox.stub(process, 'env').value({
      DPNS_CONTRACT_ID: dataContractId,
    });

    getDataTriggers = getDataTriggersFactory();
  });

  it('should return matching triggers', () => {
    let result = getDataTriggers(
      dataContractId, createDocument.getType(), createDocument.getAction(),
    );

    expect(result).to.deep.equal([createTrigger]);

    result = getDataTriggers(
      dataContractId, updateDocument.getType(), updateDocument.getAction(),
    );

    expect(result).to.deep.equal([updateTrigger]);

    result = getDataTriggers(
      dataContractId, deleteDocument.getType(), deleteDocument.getAction(),
    );

    expect(result).to.deep.equal([deleteTrigger]);
  });

  it('should return empty trigger array for any other type except `domain`', () => {
    const result = getDataTriggers(
      dataContractId, 'otherType', Document.ACTIONS.CREATE,
    );

    expect(result).to.deep.equal([]);
  });
});
