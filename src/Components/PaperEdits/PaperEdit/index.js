import React, { Component, Suspense } from 'react';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye } from '@fortawesome/free-solid-svg-icons';
import Skeleton from '@material-ui/lab/Skeleton';
import CustomBreadcrumb from '../../lib/CustomBreadcrumb/index.js';
import ApiWrapper from '../../../ApiWrapper/index.js';
const Transcripts = React.lazy(() => import('./Transcripts/index.js'));
const ProgramScript = React.lazy(() => import('./ProgramScript/index.js'));

class PaperEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projectId: this.props.match.params.projectId,
      papereditId: this.props.match.params.papereditId,
      projectTitle: '',
      programmeTitle: '',
      transcripts: [],
      labelsOptions: [],
      isTranscriptsShown: true,
      isProgramScriptShown: true,
      // annotations:[]
    };
  }

  componentDidMount = async () => {
    ApiWrapper.getProgrammeScriptAndTranscripts(this.state.projectId, this.state.papereditId).then(json => {
      console.log('componentDidMount - json getProgrammeScriptAndTranscripts', json);
      console.log('projectTitle', json.project.title);
      this.setState({
        programmeTitle: json.programmeScript.title,
        projectTitle: json.project.title,
        transcripts: json.transcripts,
        labelsOptions: json.labels,
      });
    });
  };

  toggleTranscripts = () => {
    if (this.state.isProgramScriptShown) {
      this.setState(state => {
        return {
          isTranscriptsShown: !state.isTranscriptsShown,
        };
      });
    }
  };

  toggleProgramScript = () => {
    if (this.state.isTranscriptsShown) {
      this.setState(state => {
        return {
          isProgramScriptShown: !state.isProgramScriptShown,
        };
      });
    }
  };

  render() {
    return (
      <Container
        style={
          {
            //  backgroundColor: '#eee'
          }
        }
        fluid
      >
        <Row>
          <Col xs={12} sm={8} md={8} ld={8} xl={8}>
            <CustomBreadcrumb
              backgroundColor={'transparent'}
              items={[
                {
                  name: 'Projects',
                  link: '/projects',
                },
                {
                  name: `Project: ${this.state.projectTitle}`,
                  link: `/projects/${this.state.projectId}`,
                },
                {
                  name: 'PaperEdits',
                },
                {
                  name: `${this.state.programmeTitle}`,
                },
              ]}
            />
          </Col>
          <Col xs={12} sm={4} md={4} ld={4} xl={4}>
            <div className="d-flex flex-column">
              <ButtonGroup className="mt-2" size="md" block>
                <Button onClick={this.toggleTranscripts} variant={'light'} size="sm">
                  Transcripts <FontAwesomeIcon icon={this.state.isTranscriptsShown ? faEye : faEyeSlash} />
                </Button>
                <Button onClick={this.toggleProgramScript} variant={'light'} size="sm">
                  Program Script <FontAwesomeIcon icon={this.state.isProgramScriptShown ? faEye : faEyeSlash} />
                </Button>
              </ButtonGroup>
            </div>
          </Col>
        </Row>

        <Container fluid={true}>
          <Row>
            <Col
              xs={{ span: 12, offset: 0 }}
              sm={{
                span: this.state.isProgramScriptShown ? 7 : 12,
                offset: this.state.isProgramScriptShown ? 0 : 0,
              }}
              md={{
                span: this.state.isProgramScriptShown ? 7 : 12,
                offset: this.state.isProgramScriptShown ? 0 : 0,
              }}
              lg={{
                span: this.state.isProgramScriptShown ? 7 : 10,
                offset: this.state.isProgramScriptShown ? 0 : 1,
              }}
              xl={{
                span: this.state.isProgramScriptShown ? 7 : 10,
                offset: this.state.isProgramScriptShown ? 0 : 1,
              }}
              style={{ display: this.state.isTranscriptsShown ? 'block' : 'none' }}
            >
              <div className={['d-block', 'd-sm-none'].join(' ')}>
                <br />
              </div>
              <Suspense
                fallback={
                  <Row>
                    <Col xs={12} sm={3} md={3} lg={3} xl={3}>
                      <Skeleton variant="rect" width={'100%'} height={634} />
                    </Col>
                    <Col xs={12} sm={9} md={9} lg={9} xl={9}>
                      <Skeleton variant="rect" width={'100%'} height={634} />
                    </Col>
                  </Row>
                }
              >
                {this.state.transcripts.length ? (
                  <Transcripts projectId={this.state.projectId} transcripts={this.state.transcripts} labelsOptions={this.state.labelsOptions} />
                ) : (
                  <>
                    <Row>
                      <Col>
                        <Skeleton variant="rect" width={'100%'} height={634} />
                      </Col>
                    </Row>
                  </>
                )}
              </Suspense>
            </Col>
            <Col
              xs={{ span: 12, offset: 0 }}
              sm={{
                span: this.state.isTranscriptsShown ? 5 : 12,
                offset: this.state.isTranscriptsShown ? 0 : 0,
              }}
              md={{
                span: this.state.isTranscriptsShown ? 5 : 12,
                offset: this.state.isTranscriptsShown ? 0 : 0,
              }}
              lg={{
                span: this.state.isTranscriptsShown ? 5 : 10,
                offset: this.state.isTranscriptsShown ? 0 : 1,
              }}
              xl={{
                span: this.state.isTranscriptsShown ? 5 : 8,
                offset: this.state.isTranscriptsShown ? 0 : 2,
              }}
              style={{ display: this.state.isProgramScriptShown ? 'block' : 'none' }}
            >
              <Suspense
                fallback={
                  <>
                    <Row>
                      <Skeleton variant="rect" width={'100%'} height={200} />
                    </Row>
                    <br />
                    <Row>
                      <Col>
                        <Skeleton variant="rect" width={'100%'} height={30} />
                      </Col>
                      <Col>
                        <Skeleton variant="rect" width={'100%'} height={30} />
                      </Col>
                    </Row>
                    <br />
                    <Row>
                      <Col>
                        <Skeleton variant="rect" width={'100%'} height={30} />
                      </Col>
                    </Row>
                    <br />
                    <Row>
                      <Skeleton variant="rect" width={'100%'} height={300} />
                    </Row>
                  </>
                }
              >
                <ProgramScript projectId={this.state.projectId} papereditId={this.state.papereditId} transcripts={this.state.transcripts} />
              </Suspense>
            </Col>
          </Row>
        </Container>
      </Container>
    );
  }
}

export default PaperEdit;
