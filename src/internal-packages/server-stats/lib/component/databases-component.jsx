const React = require('react');
// const debug = require('debug')('mongodb-compass:server-stats-databases');

const dataDB = require('./data-db');

class App extends React.Component {
  render() {
    return (
      <section className="rtDbs">
        <DBLevel />
      </section>
    );
  }
}

class DBLevel extends React.Component {
  render() {
    var rows = dataDB.map(function(row, i) {
      return (
          <div className="rtDbs__row" key={`list-item-${i}`}>
            <div className="rtDbs__row-item">
              <div className="rtDbs__row-text">{row.dbName}</div>
            </div>
            <div className="rtDbs__row-item">
              <div className="rtDbs__row-text">{row.collections}</div>
            </div>
            <div className="rtDbs__row-item">
              <div className="rtDbs__row-text">{row.size}</div>
            </div>
            <div className="rtDbs__row-item">
              <div className="rtDbs__row-text">{row.indexes}</div>
            </div>
            <div className="rtDbs__row-item">
              <div className="rtDbs__row-text">{row.indexesSize}</div>
            </div>

          </div>
      );
    });
    // <div className="rtDbs__row-item">
    //   <img className="rtDbs__row-text" src={IconDelete} alt="delete" />
    // </div>
    return (
      <section className="rtDbs__container">
        <section className="rtDbs__table">
          <div className="rtDbs__header">
            <div className="rtDbs__headerItem">Db Name</div>
            <div className="rtDbs__headerItem">Collections</div>
            <div className="rtDbs__headerItem">Size</div>
            <div className="rtDbs__headerItem">Indexes</div>
            <div className="rtDbs__headerItem">Indexes Size</div>
            <div className="rtDbs__headerItem"></div>
          </div>
          {rows}
        </section>
      </section>
    );
  }
}
module.exports = App;
