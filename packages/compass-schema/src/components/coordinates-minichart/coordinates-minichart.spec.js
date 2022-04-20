import { Double } from 'bson';

const VALUES = [
  [-68.673123, 44.159235],
  [-68.6731339, 44.1592408],
  [-68.671159, 44.305953],
  [-68.6646152, 44.1561619],
  [-68.6628684, 44.1561432],
  [-68.6606818, 44.1546851],
  [-68.6319351, 44.2080961],
  [-68.6590683, 44.1631218],
  [-68.6556063, 44.1560046],
  [-68.7121141, 44.172655],
  [-68.7171572, 44.1564011],
  [-68.6840132, 44.2003412],
].map((v) => [new Double(v[0]), new Double(v[1])]);

const EXPECTED_BOUNDS = {
  _southWest: { lat: 44.1546851, lng: -68.7171572 },
  _northEast: { lat: 44.305953, lng: -68.6319351 },
};

const EXPECTED_GEOPOINTS = [
  {
    type: 'Point',
    coordinates: [44.159235, -68.673123],
    center: [44.159235, -68.673123],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.159235,-68.673123]' }],
    key: '44.159235,-68.673123 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.1592408, -68.6731339],
    center: [44.1592408, -68.6731339],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.1592408,-68.6731339]' }],
    key: '44.1592408,-68.6731339 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.305953, -68.671159],
    center: [44.305953, -68.671159],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.305953,-68.671159]' }],
    key: '44.305953,-68.671159 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.1561619, -68.6646152],
    center: [44.1561619, -68.6646152],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.1561619,-68.6646152]' }],
    key: '44.1561619,-68.6646152 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.1561432, -68.6628684],
    center: [44.1561432, -68.6628684],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.1561432,-68.6628684]' }],
    key: '44.1561432,-68.6628684 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.1546851, -68.6606818],
    center: [44.1546851, -68.6606818],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.1546851,-68.6606818]' }],
    key: '44.1546851,-68.6606818 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.2080961, -68.6319351],
    center: [44.2080961, -68.6319351],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.2080961,-68.6319351]' }],
    key: '44.2080961,-68.6319351 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.1631218, -68.6590683],
    center: [44.1631218, -68.6590683],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.1631218,-68.6590683]' }],
    key: '44.1631218,-68.6590683 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.1560046, -68.6556063],
    center: [44.1560046, -68.6556063],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.1560046,-68.6556063]' }],
    key: '44.1560046,-68.6556063 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.172655, -68.7121141],
    center: [44.172655, -68.7121141],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.172655,-68.7121141]' }],
    key: '44.172655,-68.7121141 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.1564011, -68.7171572],
    center: [44.1564011, -68.7171572],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.1564011,-68.7171572]' }],
    key: '44.1564011,-68.7171572 - #43B1E5',
  },
  {
    type: 'Point',
    coordinates: [44.2003412, -68.6840132],
    center: [44.2003412, -68.6840132],
    color: '#43B1E5',
    fields: [{ key: 'latlong', value: '[44.2003412,-68.6840132]' }],
    key: '44.2003412,-68.6840132 - #43B1E5',
  },
];

export { EXPECTED_BOUNDS, VALUES, EXPECTED_GEOPOINTS };
