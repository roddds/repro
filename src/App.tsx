import * as React from 'react';
import { HotTable, HotColumn } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';
import { registerAllModules } from 'handsontable/registry';
import { registerAllCellTypes } from 'handsontable/cellTypes';
import { columns, defaultColumnSettings } from './columns';
import './errors.css';

registerAllModules();
registerAllCellTypes();

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
      data={Array.from({ length: 1000 }, (_, i) => ({ name: `Person ${i}`, email: `person-${i}@example.com` }))}
      columns={columns}
      rowHeaders={true}
      licenseKey='non-commercial-and-evaluation' // for non-commercial use only
      settings={{
        minRows: 1000,
        rowHeaders: true,
        stretchH: 'last',
        contextMenu: ['clear_column', '---------', 'undo', 'redo', '---------', 'cut', 'copy'],
        fixedColumnsLeft: 1,
        hiddenColumns: {
          columns: [30, 31, 32, 33, 34, 35, 36, 37],
          copyPasteEnabled: true,
        },
        autoColumnSize: false,
        columnHeaderHeight: 26,
        height: 'calc(100% - 30px)',
        manualColumnResize: true,
        readOnlyCellClassName: 'read-only',
        rowHeights: 26,
        selectionMode: 'range',
        viewportColumnRenderingOffset: 50,
        viewportRowRenderingOffset: 50,
        width: '100%',
      }}
    >
      {columns.map((column) => {
        // @ts-ignore
        const { type = 'text', align = 'left', ...otherColumnProps } = column;

        let className: string | undefined;

        // @ts-ignore
        if (column.align === 'right' && column.type === 'text') {
          className = 'htRight';
        }

        const columnHeader = otherColumnProps.required ? `* ${otherColumnProps.title}` : otherColumnProps.title;
        return (
          <HotColumn
            className={className}
            // @ts-ignore
            {...defaultColumnSettings[type]}
            {...otherColumnProps}
            allowEmpty={!otherColumnProps.required}
            key={otherColumnProps.id}
            title={columnHeader}
          />
        );
      })}
    </HotTable>
  );
};

const Errors = ({ errors, hotRef }: { errors: ErrorType; hotRef: React.RefObject<HotTable> }) => {
  const hotInstance = hotRef?.current?.hotInstance;

  if (!hotInstance) {
    return null;
  }

  return (
    <table className='errors' style={{ border: '1px solid red' }}>
      {/* <thead>
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
      </thead> */}
      <tbody>
        {errors.map((error) => {
          const cell = hotInstance.getCellMeta(error.row, error.col);

          return (
            <tr>
              <td>{JSON.stringify(cell)}</td>
            </tr>
          );
          // return (
          //   <tr style={{ margin: '0' }} key={`${error.row}-${error.col}`}>
          //     <td>{cell.visualRow}</td>
          //     <td>{cell.visualCol}</td>
          //     <td>{cell.row}</td>
          //     <td>{cell.col}</td>
          //     <td>{cell.prop}</td>
          //     <td>{JSON.stringify(cell.hasExternalError)}</td>
          //     <td>{JSON.stringify(cell.valid)}</td>
          //     <td>{cell.externalErrorMessage}</td>
          //   </tr>
          // );
        })}
      </tbody>
    </table>
  );
};

function App() {
  const [_, setLoaded] = React.useState(false);
  const hotRef = React.useRef<HotTable>(null);
  const errors = Array.from({ length: 1000 }, (_, index) => ({ col: 1, row: index, errorMessage: 'This is wrong' }));

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
