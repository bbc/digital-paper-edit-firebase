import React, { useState, useEffect,
  // useLayoutEffect, useRef
} from 'react';
import PropTypes from 'prop-types';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';

const ExportForm = (props) => {
  const [ scriptExportPath, setScriptExportPath ] = useState(null); // Where ADL / EDL gets saved
  const [ isValidated, setIsValidated ] = useState(false);
  const [ filesExportPath, setFilesExportPath ] = useState(null); // Where paths for files get saved
  // const textRef = useRef();
  // const [ textWidth, setTextWidth ] = useState(-1);

  useEffect(() => {

    const setItems = () => {
      const fileExportList = [];
      props.items.forEach((item) => {
        const exportObj = {
          fileName: item.fileName,
          srcFolderPath: item.srcFolderPath
        };
        fileExportList.push(exportObj);
      });
      setFilesExportPath(fileExportList);
    };

    if (!filesExportPath) {
      setItems();
    }

    if (!scriptExportPath) {
      setScriptExportPath(props.exportPath);
    }

    return () => {};
  }, [ filesExportPath, props.exportPath, props.items, scriptExportPath ]);

  // useLayoutEffect(() => {
  //   // I don't think it can be null at this point, but better safe than sorry
  //   if (textRef.current) {
  //     setTextWidth(window.getComputedStyle(textRef.current).width);
  //   }
  // });

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();

    const formIsValid = form.checkValidity();
    setIsValidated(true);

    const filesClone = filesExportPath;
    filesClone.forEach((file) => {
      if (!file.srcFolderPath) {
        file.srcFolderPath = `${ scriptExportPath }${ props.pathJoin }${ file.fileName }`;
      }
      setFilesExportPath(filesClone);
    });

    if (formIsValid) {
      const validatedForm = {
        exportPath: scriptExportPath,
        files: filesExportPath
      };

      console.log('validated form: ', validatedForm);

      props.handleSaveForm(validatedForm);
    }
  };

  const updateFilesExportPath = (e, fileName) => {
    const exportPathClone = filesExportPath;
    const itemToChange = exportPathClone.find((obj) => {
      return obj.fileName === fileName;
    });
    itemToChange.srcFolderPath = e;
    setFilesExportPath(exportPathClone);

  };

  // const handleFilesExportPath = (e, fileName) => {

  //   // props.setFormFilePaths(e, fileName);
  // };

  // const FilesList = (
  //   <ul>
  //     {props.items.map((item) =>
  //       <li key={ `${ item }` }>
  //         {exportPath}{pathJoin}{item}
  //       </li>)}
  //   </ul>
  // );

  // const truncate = (input) => input.length > 7 ? `${ input.substring(0, 5) }...` : input;

  // const isOverflown = ({ clientWidth, clientHeight, scrollWidth, scrollHeight }) => {
  //   return scrollHeight > clientHeight || scrollWidth > clientWidth;
  // };

  const EditableFilesInputs =
    props.items.map((item) => {
      const itemPath = `${ scriptExportPath }${ props.pathJoin }${ item.fileName }`;

      return <>
        <Form.Group as={ Row } controlId="formFilePaths">
          <Form.Label
          // ref={ textRef }
            column sm={ 2 }>{item.fileName}</Form.Label>
          <Col sm={ 10 }>
            <Form.Control
              key={ itemPath }
              size="sm"
              type='text'
              defaultValue={ itemPath }
              placeholder={ itemPath }
              onChange={ (e) => updateFilesExportPath(e.target.value, item.fileName) }
            />
          </Col>
          <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          <Form.Control.Feedback type="invalid">
            Please enter a valid file path.
          </Form.Control.Feedback>
        </Form.Group>
      </>;
    });

  return (
    <>

      <Form noValidate validated={ isValidated } onSubmit={ handleSubmit }>
        <Form.Group controlId="formFolderDirectory">
          <Form.Label>Project Folder Directory</Form.Label>
          <Form.Control
            required
            type="text"
            name="fileName"
            placeholder={ props.placeholder }
            value={ scriptExportPath }
            onChange={ (e) => setScriptExportPath(e.target.value) }
          />
          <Form.Text className="text-muted">
            The folder path of the video and audio for the project.
          </Form.Text>
          <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          <Form.Control.Feedback type="invalid">
            Please enter a valid file path.
          </Form.Control.Feedback>
        </Form.Group>

        {props.items.length > 0 ?
          <Form.Group controlId="formFilePaths">
            <Form.Label>Files paths</Form.Label>
            { EditableFilesInputs }
          </Form.Group> : null}

        <Modal.Footer>
          <Button variant="primary" type="submit">
            Save
          </Button>
        </Modal.Footer>
      </Form>
    </>
  );
};

ExportForm.propTypes = {
  exportPath: PropTypes.any,
  handleSaveForm: PropTypes.func,
  isWindows: PropTypes.bool,
  items: PropTypes.array,
  pathJoin: PropTypes.any,
  placeholder: PropTypes.any,
  showModal: PropTypes.bool,
  type: PropTypes.any
};

ExportForm.defaultProps = {
  showModal: false,
};

export default ExportForm;
