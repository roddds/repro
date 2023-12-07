import * as React from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';
import { registerAllModules } from 'handsontable/registry';
import './errors.css';

registerAllModules();

type ErrorType = Array<{ row: number; col: number; errorMessage: string }>;

const useCustomSpreadsheetErrors = (hotTableRef: React.RefObject<HotTable>, errors: ErrorType) => {
  const previousErrors = React.useRef<ErrorType>([]);

  React.useEffect(() => {
    const hotInstance = hotTableRef?.current?.hotInstance;

    if (!hotInstance || !(errors.length + previousErrors.current!.length)) {
      return;
    }

    hotInstance.batchRender(function render() {
      previousErrors.current?.forEach((error) => {
        hotInstance.setCellMetaObject(error.row, error.col, {
          hasExternalError: false,
          valid: true,
        });

        const cell = hotInstance.getCell(error.row, error.col);

        if (cell) {
          cell.removeAttribute('data-error');
        }
      });

      errors.forEach((error) => {
        /*
          For some unknown reason, setCellMetaObject only works correctly if we call
          getCellMeta first. If we don't, the cell will be marked as invalid, but the
          original values in the meta object will be removed, causing ErrorSlider to
          crash. See INK-1955.
        */
        // hotInstance.getCellMeta(error.row, error.col);
        hotInstance.setCellMetaObject(error.row, error.col, {
          hasExternalError: true,
          externalErrorMessage: error.errorMessage,
          valid: false,
        });

        const cell = hotInstance.getCell(error.row, error.col);

        if (cell) {
          cell.dataset.error = error.errorMessage;
        }
      });

      hotInstance.render();
    });

    previousErrors.current = errors;
  }, [errors, hotTableRef]);
};

export { useCustomSpreadsheetErrors };

const SpreadsheetTable = ({
  errors,
  hotRef,
  afterInit,
}: {
  errors: ErrorType;
  hotRef: React.RefObject<HotTable>;
  afterInit: () => void;
}) => {
  useCustomSpreadsheetErrors(hotRef, errors);

  return (
    <HotTable
      ref={hotRef}
      afterInit={afterInit}
      invalidCellClassName='invalid-cell'
      width='100%'
      height='600px'
      data={Array.from({ length: 200 }, (_, i) =>
        Array.from({ length: 9 }, (_, j) => String.fromCharCode(65 + j) + (i + 1))
      )}
      colHeaders={['ID', 'Full name', 'Position', 'Country', 'City', 'Address', 'Zip code', 'Mobile', 'E-mail']}
      rowHeaders={true}
      licenseKey='non-commercial-and-evaluation' // for non-commercial use only
    />
  );
};

const Errors = ({ errors, hotRef }: { errors: ErrorType; hotRef: React.RefObject<HotTable> }) => {
  const hotInstance = hotRef?.current?.hotInstance;

  if (!hotInstance) {
    return null;
  }

  return (
    <table className='errors' style={{ border: '1px solid red' }}>
      <thead>
        <tr>
          <td>cell.visualRow</td>
          <td>cell.visualCol</td>
          <td>cell.row</td>
          <td>cell.col</td>
          <td>cell.prop</td>
          <td>cell.hasExternalError</td>
          <td>cell.valid</td>
          <td>cell.externalErrorMessage</td>
        </tr>
      </thead>
      {errors.map((error) => {
        const cell = hotInstance.getCellMeta(error.row, error.col);

        return (
          <tr style={{ margin: '0' }} key={`${error.row}-${error.col}`}>
            <td>{cell.visualRow}</td>
            <td>{cell.visualCol}</td>
            <td>{cell.row}</td>
            <td>{cell.col}</td>
            <td>{cell.prop}</td>
            <td>{JSON.stringify(cell.hasExternalError)}</td>
            <td>{JSON.stringify(cell.valid)}</td>
            <td>{cell.externalErrorMessage}</td>
          </tr>
        );
      })}
    </table>
  );
};

function App() {
  const [_, setLoaded] = React.useState(false);
  const hotRef = React.useRef<HotTable>(null);
  const errors = Array.from({ length: 200 }, (_, index) => ({ col: 1, row: index, errorMessage: 'This is wrong' }));

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: '1' }}>
        <SpreadsheetTable hotRef={hotRef} errors={errors} afterInit={() => setLoaded(true)} />
      </div>
      <div style={{ flex: '1 0 30%' }}>{hotRef.current && <Errors hotRef={hotRef} errors={errors} />}</div>
    </div>
  );
}

export default App;
