const React = require('react');
const { Row, Col } = require('react-bootstrap');

class StatusRow extends React.Component {

  /**
   * Render status row component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <Row className="status-row">
        <Col lg={12} md={12} sm={12} xs={12}>
          {this.props.children}
        </Col>
      </Row>
    );
  }
}

StatusRow.propTypes = {
  children: React.PropTypes.node
};

StatusRow.displayName = 'StatusRow';

module.exports = StatusRow;
