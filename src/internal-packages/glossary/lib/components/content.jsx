const React = require('react');

const GlossaryComponent = require('./component');

class Content extends React.Component {
  render() {
    const entry = this.props.entry;
    return (
      <div className="glossary-content">
        {
          Object.keys(entry).map(name => {
            const states = entry[name];
            return (
              <GlossaryComponent key={name} name={name} states={states} />
            );
          })
        }
      </div>
    );
  }
}

Content.propTypes = {
  entry: React.PropTypes.object
};

module.exports = Content;
