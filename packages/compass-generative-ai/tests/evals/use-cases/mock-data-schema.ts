import type {
  MockDataGeneratorCaseConfig,
  MockDataInputFieldSchema,
} from '../types';
import { DatelikeMethodCriterion, IdlikeMethodCriterion } from '../types';

function removeSampleValues(
  schema: MockDataInputFieldSchema
): MockDataInputFieldSchema {
  return Object.fromEntries(
    Object.entries(schema).map(([key, { sampleValues, ...rest }]) => [
      key,
      rest,
    ])
  );
}

// --- Simple Case ---

const simpleCase: MockDataGeneratorCaseConfig = {
  metadata: {
    name: 'Simple Example',
    hasSampleValues: false,
  },
  providedSchema: {
    name: {
      type: 'String',
      probability: 1,
    },
    age: {
      type: 'Number',
      probability: 1,
    },
    address: {
      type: 'String',
      probability: 1,
    },
    state: {
      type: 'String',
      probability: 1,
    },
    zipcode: {
      type: 'String',
      probability: 1,
    },
  },
  expectedResponse: {
    fields: [
      {
        fakerArgs: [],
        fakerMethod: 'person.fullName',
        fieldPath: 'name',
      },
      {
        fakerArgs: [
          {
            json: '{"min":18,"max":99}',
          },
        ],
        fakerMethod: 'number.int',
        fieldPath: 'age',
      },
      {
        fakerArgs: [],
        fakerMethod: 'location.streetAddress',
        fieldPath: 'address',
      },
      {
        fakerArgs: [
          {
            json: '{"abbreviated":true}',
          },
        ],
        fakerMethod: 'location.state',
        fieldPath: 'state',
      },
      {
        fakerArgs: [],
        fakerMethod: 'location.zipCode',
        fieldPath: 'zipcode',
      },
    ],
  },
};

// --- Charge Credit Case ---

export const chargeCreditCase: MockDataGeneratorCaseConfig = {
  metadata: {
    name: 'Charge Credit Example',
    hasSampleValues: true,
  },
  providedSchema: {
    id: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['credgr_test_61R9a6NUWsRmOW3RM41L6nFOS1ekDGHo'],
    },
    object: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['billing.credit_grant'],
    },
    'amount.monetary.currency': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['usd', 'eur', 'gbp'],
    },
    'amount.monetary.value': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [1000, 2500, 5000, 10000],
    },
    'amount.type': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['monetary'],
    },
    'applicability_config.scope.price_type': {
      type: 'String',
      probability: 0.8,
      sampleValues: ['metered'],
    },
    'applicability_config.scope.prices[].id': {
      type: 'String',
      probability: 0.2,
      sampleValues: ['price_1234567890', 'price_0987654321'],
    },
    category: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['paid', 'promotional'],
    },
    created: {
      type: 'Number',
      probability: 1.0,
      sampleValues: [1726620803, 1729297860, 1632150400],
    },
    customer: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['cus_QrvQguzkIK8zTj', 'cus_ABC123XYZ789'],
    },
    effective_at: {
      type: 'Number',
      probability: 0.8,
      sampleValues: [1729297860, null],
    },
    expires_at: {
      type: 'Number',
      probability: 0.6,
      sampleValues: [1761747200, null],
    },
    name: {
      type: 'String',
      probability: 0.7,
      sampleValues: ['Purchased Credits', null],
    },
    priority: {
      type: 'Number',
      probability: 0.6,
      sampleValues: [0, 25, 50, 75, 100, null],
    },
    updated: {
      type: 'Number',
      probability: 1.0,
      sampleValues: [1726620803, 1729297860, 1732150400],
    },
    voided_at: {
      type: 'Number',
      probability: 0.1,
      sampleValues: [1729297860, null],
    },
  },
  expectedResponse: {
    fields: [
      {
        fieldPath: 'id',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [
          {
            json: JSON.stringify({
              length: { min: 35, max: 40 },
              casing: 'lower',
              prefix: 'credgr_test_',
            }),
          },
        ],
      },
      {
        fieldPath: 'object',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["billing.credit_grant"]' }],
      },
      {
        fieldPath: 'amount.monetary.currency',
        fakerMethod: 'finance.currencyCode',
        fakerArgs: [],
      },
      {
        fieldPath: 'amount.monetary.value',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'amount.type',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["monetary"]' }],
      },
      {
        fieldPath: 'applicability_config.scope.price_type',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["metered"]' }],
      },
      {
        fieldPath: 'applicability_config.scope.prices[].id',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'category',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["paid", "promotional"]' }],
      },
      {
        fieldPath: 'created',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'customer',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [
          {
            json: JSON.stringify({
              length: { min: 14, max: 18 },
              casing: 'mixed',
              prefix: 'cus_',
            }),
          },
        ],
      },
      {
        fieldPath: 'effective_at',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'expires_at',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'name',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Purchased Credits"]' }],
      },
      {
        fieldPath: 'priority',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'updated',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'voided_at',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
    ],
  },
};

const chargeCreditCaseWithoutSampleValues: MockDataGeneratorCaseConfig = {
  metadata: {
    name: 'Charge Credit Example Without Sample Values',
    hasSampleValues: false,
  },
  providedSchema: removeSampleValues(chargeCreditCase.providedSchema),
  expectedResponse: {
    fields: [
      {
        fieldPath: 'id',
        fakerMethod: IdlikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'object',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'amount.monetary.currency',
        fakerMethod: 'finance.currencyCode',
        fakerArgs: [],
      },
      {
        fieldPath: 'amount.monetary.value',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'amount.type',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'applicability_config.scope.price_type',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'applicability_config.scope.prices[].id',
        fakerMethod: IdlikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'category',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'created',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'customer',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'effective_at',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'expires_at',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'name',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'priority',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'updated',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'voided_at',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
    ],
  },
};

// --- Ecommerce Case ---

const ecommerceCase: MockDataGeneratorCaseConfig = {
  metadata: {
    name: 'Ecommerce Example',
    hasSampleValues: true,
  },
  providedSchema: {
    _id: {
      type: 'ObjectId',
      probability: 1.0,
      sampleValues: ['507f1f77bcf86cd799439011'],
    },
    orderNumber: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['ORD-2024-789456'],
    },
    status: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['shipped', 'processing', 'delivered'],
    },
    placedAt: {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2024-10-15T14:23:45.123Z'],
    },
    updatedAt: {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2024-10-15T14:23:45.123Z'],
    },
    'customer.customerId': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['cust_abc123xyz'],
    },
    'customer.email': {
      type: 'String',
      probability: 1.0,
    },
    'customer.name.first': {
      type: 'String',
      probability: 1.0,
    },
    'customer.name.last': {
      type: 'String',
      probability: 1.0,
    },
    'customer.loyaltyTier': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['bronze', 'silver', 'gold', 'platinum'],
    },
    'customer.accountCreated': {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2022-03-12T00:00:00.000Z'],
    },
    'shippingAddress.recipient': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Sarah Mitchell'],
    },
    'shippingAddress.street': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['742 Evergreen Terrace'],
    },
    'shippingAddress.unit': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Apt 3B'],
    },
    'shippingAddress.city': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Portland'],
    },
    'shippingAddress.state': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['OR'],
    },
    'shippingAddress.postalCode': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['97204'],
    },
    'shippingAddress.country': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['US'],
    },
    'shippingAddress.phone': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['+1-503-555-0142'],
    },
    'shippingAddress.instructions': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Leave package with building concierge'],
    },
    'billingAddress.street': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['742 Evergreen Terrace'],
    },
    'billingAddress.unit': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Apt 3B'],
    },
    'billingAddress.city': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Portland'],
    },
    'billingAddress.state': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['OR'],
    },
    'billingAddress.postalCode': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['97204'],
    },
    'billingAddress.country': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['US'],
    },
    'items[].itemId': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['item_001', 'item_002'],
    },
    'items[].productId': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['prod_wireless_headphones_xm5', 'prod_usbc_cable_braided'],
    },
    'items[].sku': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['TECH-AUD-WH-XM5-BLK', 'ACC-CBL-USBC-2M-GRY'],
    },
    'items[].name': {
      type: 'String',
      probability: 1.0,
      sampleValues: [
        'Premium Wireless Headphones XM5',
        'Braided USB-C Cable (2m)',
      ],
    },
    'items[].category[]': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Electronics', 'Audio', 'Headphones'],
    },
    'items[].quantity': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [1, 2],
    },
    'items[].pricing.unitPrice': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [349.99, 19.99],
    },
    'items[].pricing.discount.amount': {
      type: 'Number',
      probability: 0.7,
      sampleValues: [35.0],
    },
    'items[].pricing.discount.code': {
      type: 'String',
      probability: 0.7,
      sampleValues: ['GOLD10'],
    },
    'items[].pricing.discount.type': {
      type: 'String',
      probability: 0.7,
      sampleValues: ['loyalty_discount'],
    },
    'items[].pricing.finalPrice': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [314.99, 19.99],
    },
    'items[].pricing.tax': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [27.12, 1.72],
    },
    'items[].fulfillment.warehouse': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['PDX-01'],
    },
    'items[].fulfillment.status': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['shipped', 'processing', 'delivered'],
    },
    'items[].fulfillment.carrier': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['FedEx', 'UPS', 'USPS'],
    },
    'items[].fulfillment.trackingNumber': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['7849302847561234'],
    },
    'items[].fulfillment.shippedAt': {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2024-10-16T10:30:00.000Z'],
    },
    'items[].fulfillment.estimatedDelivery': {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2024-10-18T23:59:59.999Z'],
    },
    'items[].attributes.color': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Midnight Black', 'Space Grey'],
    },
    'items[].attributes.warranty': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['2-year manufacturer'],
    },
    'items[].attributes.batteryLife': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['30 hours'],
    },
    'items[].attributes.length': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['2 meters'],
    },
    'items[].attributes.fastCharging': {
      type: 'Boolean',
      probability: 1.0,
      sampleValues: [true],
    },
    'pricing.subtotal': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [354.97],
    },
    'pricing.discounts': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [35.0],
    },
    'pricing.shipping': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [0.0],
    },
    'pricing.tax': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [28.84],
    },
    'pricing.total': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [348.81],
    },
    'pricing.currency': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['USD'],
    },
  },
  expectedResponse: {
    fields: [
      {
        fieldPath: '_id',
        fakerMethod: 'database.mongodbObjectId',
        fakerArgs: [],
      },
      {
        fieldPath: 'orderNumber',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [
          {
            json: JSON.stringify({
              length: 15,
              casing: 'upper',
              prefix: 'ORD-',
            }),
          },
        ],
      },
      {
        fieldPath: 'status',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["shipped", "processing", "delivered"]' }],
      },
      {
        fieldPath: 'placedAt',
        fakerMethod: 'date.past',
        fakerArgs: [],
      },
      {
        fieldPath: 'updatedAt',
        fakerMethod: 'date.past',
        fakerArgs: [],
      },
      {
        fieldPath: 'customer.customerId',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [
          {
            json: JSON.stringify({
              length: 14,
              casing: 'lower',
              prefix: 'cust_',
            }),
          },
        ],
      },
      {
        fieldPath: 'customer.email',
        fakerMethod: 'internet.email',
        fakerArgs: [],
      },
      {
        fieldPath: 'customer.name.first',
        fakerMethod: 'person.firstName',
        fakerArgs: [],
      },
      {
        fieldPath: 'customer.name.last',
        fakerMethod: 'person.lastName',
        fakerArgs: [],
      },
      {
        fieldPath: 'customer.loyaltyTier',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["bronze", "silver", "gold", "platinum"]' }],
      },
      {
        fieldPath: 'customer.accountCreated',
        fakerMethod: 'date.past',
        fakerArgs: [],
      },
      {
        fieldPath: 'shippingAddress.recipient',
        fakerMethod: 'person.fullName',
        fakerArgs: [],
      },
      {
        fieldPath: 'shippingAddress.street',
        fakerMethod: 'location.streetAddress',
        fakerArgs: [],
      },
      {
        fieldPath: 'shippingAddress.unit',
        fakerMethod: 'location.secondaryAddress',
        fakerArgs: [],
      },
      {
        fieldPath: 'shippingAddress.city',
        fakerMethod: 'location.city',
        fakerArgs: [],
      },
      {
        fieldPath: 'shippingAddress.state',
        fakerMethod: 'location.state',
        fakerArgs: [{ json: JSON.stringify({ abbreviated: true }) }],
      },
      {
        fieldPath: 'shippingAddress.postalCode',
        fakerMethod: 'location.zipCode',
        fakerArgs: [],
      },
      {
        fieldPath: 'shippingAddress.country',
        fakerMethod: 'location.countryCode',
        fakerArgs: [],
      },
      {
        fieldPath: 'shippingAddress.phone',
        fakerMethod: 'phone.number',
        fakerArgs: [],
      },
      {
        fieldPath: 'shippingAddress.instructions',
        fakerMethod: 'lorem.sentence',
        fakerArgs: [],
      },
      {
        fieldPath: 'billingAddress.street',
        fakerMethod: 'location.streetAddress',
        fakerArgs: [],
      },
      {
        fieldPath: 'billingAddress.unit',
        fakerMethod: 'location.secondaryAddress',
        fakerArgs: [],
      },
      {
        fieldPath: 'billingAddress.city',
        fakerMethod: 'location.city',
        fakerArgs: [],
      },
      {
        fieldPath: 'billingAddress.state',
        fakerMethod: 'location.state',
        fakerArgs: [{ json: JSON.stringify({ abbreviated: true }) }],
      },
      {
        fieldPath: 'billingAddress.postalCode',
        fakerMethod: 'location.zipCode',
        fakerArgs: [],
      },
      {
        fieldPath: 'billingAddress.country',
        fakerMethod: 'location.countryCode',
        fakerArgs: [],
      },
      {
        fieldPath: 'items[].itemId',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [{ json: JSON.stringify({ length: 8, prefix: 'item_' }) }],
      },
      {
        fieldPath: 'items[].productId',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [{ json: JSON.stringify({ length: 20, prefix: 'prod_' }) }],
      },
      {
        fieldPath: 'items[].sku',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [{ json: JSON.stringify({ length: 15, casing: 'upper' }) }],
      },
      {
        fieldPath: 'items[].name',
        fakerMethod: 'commerce.productName',
        fakerArgs: [],
      },
      {
        fieldPath: 'items[].category[]',
        fakerMethod: 'helpers.arrayElements',
        fakerArgs: [
          {
            json: JSON.stringify(['Electronics', 'Audio', 'Headphones']),
          },
        ],
      },
      {
        fieldPath: 'items[].quantity',
        fakerMethod: 'number.int',
        fakerArgs: [{ json: JSON.stringify({ min: 1, max: 5 }) }],
      },
      {
        fieldPath: 'items[].pricing.unitPrice',
        fakerMethod: 'commerce.price',
        fakerArgs: [{ json: JSON.stringify({ min: 10, max: 500, dec: 2 }) }],
      },
      {
        fieldPath: 'items[].pricing.discount.amount',
        fakerMethod: 'number.float',
        fakerArgs: [
          {
            json: JSON.stringify({
              min: 5,
              max: 50,
              fractionDigits: 2,
            }),
          },
        ],
      },
      {
        fieldPath: 'items[].pricing.discount.code',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [{ json: JSON.stringify({ length: 8, casing: 'upper' }) }],
      },
      {
        fieldPath: 'items[].pricing.discount.type',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["loyalty_discount"]' }],
      },
      {
        fieldPath: 'items[].pricing.finalPrice',
        fakerMethod: 'commerce.price',
        fakerArgs: [{ json: JSON.stringify({ min: 10, max: 500, dec: 2 }) }],
      },
      {
        fieldPath: 'items[].pricing.tax',
        fakerMethod: 'number.float',
        fakerArgs: [
          {
            json: JSON.stringify({
              min: 0.5,
              max: 50,
              fractionDigits: 2,
            }),
          },
        ],
      },
      {
        fieldPath: 'items[].fulfillment.warehouse',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [
          {
            json: JSON.stringify({
              length: 6,
              casing: 'upper',
              prefix: '',
            }),
          },
        ],
      },
      {
        fieldPath: 'items[].fulfillment.status',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["shipped", "processing", "delivered"]' }],
      },
      {
        fieldPath: 'items[].fulfillment.carrier',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["FedEx", "UPS", "USPS"]' }],
      },
      {
        fieldPath: 'items[].fulfillment.trackingNumber',
        fakerMethod: 'string.numeric',
        fakerArgs: [{ json: JSON.stringify({ length: 16 }) }],
      },
      {
        fieldPath: 'items[].fulfillment.shippedAt',
        fakerMethod: 'date.recent',
        fakerArgs: [],
      },
      {
        fieldPath: 'items[].fulfillment.estimatedDelivery',
        fakerMethod: 'date.future',
        fakerArgs: [],
      },
      {
        fieldPath: 'items[].attributes.color',
        fakerMethod: 'color.human',
        fakerArgs: [],
      },
      {
        fieldPath: 'items[].attributes.warranty',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [
          {
            json: '["1-year manufacturer", "2-year manufacturer", "3-year extended", "Limited lifetime"]',
          },
        ],
      },
      {
        fieldPath: 'items[].attributes.batteryLife',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [
          {
            json: '["8 hours", "12 hours", "24 hours", "30 hours", "48 hours"]',
          },
        ],
      },
      {
        fieldPath: 'items[].attributes.length',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [
          { json: '["1 meter", "1.5 meters", "2 meters", "3 meters"]' },
        ],
      },
      {
        fieldPath: 'items[].attributes.fastCharging',
        fakerMethod: 'datatype.boolean',
        fakerArgs: [],
      },
      {
        fieldPath: 'pricing.subtotal',
        fakerMethod: 'commerce.price',
        fakerArgs: [],
      },
      {
        fieldPath: 'pricing.discounts',
        fakerMethod: 'commerce.price',
        fakerArgs: [],
      },
      {
        fieldPath: 'pricing.shipping',
        fakerMethod: 'commerce.price',
        fakerArgs: [],
      },
      {
        fieldPath: 'pricing.tax',
        fakerMethod: 'commerce.price',
        fakerArgs: [],
      },
      {
        fieldPath: 'pricing.total',
        fakerMethod: 'commerce.price',
        fakerArgs: [],
      },
      {
        fieldPath: 'pricing.currency',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["USD"]' }],
      },
    ],
  },
};

// --- Funding Event Case ---

export const fundingEventCase: MockDataGeneratorCaseConfig = {
  metadata: {
    name: 'Funding Event Example',
    hasSampleValues: true,
  },
  providedSchema: {
    token: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['b68b7424-aa69-4cbc-a946-30d90181b621'],
    },
    'collection_tokens[]': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['b68b7424-aa69-4cbc-a946-30d90181b621'],
    },
    previous_high_watermark: {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2024-01-01T00:00:00Z'],
    },
    high_watermark: {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2024-01-01T00:00:00Z'],
    },
    collection_resource_type: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['PAYMENT'],
    },
    'network_settlement_summary[].settled_gross_amount': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [0],
    },
    'network_settlement_summary[].network_settlement_date': {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2024-01-01'],
    },
    created: {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2024-01-01T00:00:00Z'],
    },
    updated: {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2024-01-01T00:00:00Z'],
    },
  },
  expectedResponse: {
    fields: [
      {
        fieldPath: 'token',
        fakerMethod: 'string.uuid',
        fakerArgs: [],
      },
      {
        fieldPath: 'collection_tokens[]',
        fakerMethod: 'string.uuid',
        fakerArgs: [],
      },
      {
        fieldPath: 'previous_high_watermark',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'high_watermark',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'collection_resource_type',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["PAYMENT"]' }],
      },
      {
        fieldPath: 'network_settlement_summary[].settled_gross_amount',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'network_settlement_summary[].network_settlement_date',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'created',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'updated',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
    ],
  },
};

const fundingEventCaseWithoutSampleValues: MockDataGeneratorCaseConfig = {
  metadata: {
    name: 'Funding Event Example (no sample values)',
    hasSampleValues: false,
  },
  providedSchema: removeSampleValues(fundingEventCase.providedSchema),
  expectedResponse: {
    fields: [
      {
        fieldPath: 'token',
        fakerMethod: IdlikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'collection_tokens[]',
        fakerMethod: IdlikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'previous_high_watermark',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'high_watermark',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'collection_resource_type',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'network_settlement_summary[].settled_gross_amount',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'network_settlement_summary[].network_settlement_date',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'created',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'updated',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
    ],
  },
};

// --- Weather Gridpoint Case ---

export const weatherGridpointCase: MockDataGeneratorCaseConfig = {
  metadata: {
    name: 'Weather Gridpoint Example',
    hasSampleValues: true,
  },
  providedSchema: {
    Id: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['points/35.1234,-106.5678'],
    },
    Type: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Feature'],
    },
    'properties.geometry': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['POINT(-106.5678 35.1234)'],
    },
    'properties.@id': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['https://api.weather.gov/points/35.1234,-106.5678'],
    },
    'properties.@type': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['wx:Gridpoint'],
    },
    'properties.updateTime': {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2025-10-22T18:06:52.632Z'],
    },
    'properties.elevation.value': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [1650, 2100, 850],
    },
    'properties.elevation.maxValue': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [2000, 2500, 1100],
    },
    'properties.elevation.minValue': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [1200, 1600, 500],
    },
    'properties.elevation.unitCode': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['wmoUnit:m'],
    },
    'properties.elevation.qualityControl': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Z'],
    },
    'properties.forecastOffice': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['ABQ', 'PHX', 'DEN'],
    },
    'properties.gridId': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['ABQ', 'PHX', 'DEN'],
    },
    'properties.gridX': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [85, 110, 150],
    },
    'properties.gridY': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [42, 65, 98],
    },
    'properties.weather.values[].value[].coverage': {
      type: 'String',
      probability: 0.9,
      sampleValues: ['areas', 'scattered', 'isolated', 'chance'],
    },
    'properties.weather.values[].value[].weather': {
      type: 'String',
      probability: 0.9,
      sampleValues: ['blowing_dust', 'rain', 'snow', 'thunderstorms'],
    },
    'properties.weather.values[].value[].intensity': {
      type: 'String',
      probability: 0.9,
      sampleValues: ['very_light', 'light', 'moderate', 'heavy'],
    },
    'properties.weather.values[].value[].visibility.value': {
      type: 'Number',
      probability: 0.9,
      sampleValues: [10000, 5000, 1000],
    },
    'properties.weather.values[].value[].visibility.maxValue': {
      type: 'Number',
      probability: 0.9,
      sampleValues: [15000, 10000, 5000],
    },
    'properties.weather.values[].value[].visibility.minValue': {
      type: 'Number',
      probability: 0.9,
      sampleValues: [1000, 500, 100],
    },
    'properties.weather.values[].value[].visibility.unitCode': {
      type: 'String',
      probability: 0.9,
      sampleValues: ['wmoUnit:m'],
    },
    'properties.weather.values[].value[].visibility.qualityControl': {
      type: 'String',
      probability: 0.9,
      sampleValues: ['Z'],
    },
    'properties.weather.values[].value[].attributes[]': {
      type: 'String',
      probability: 0.5,
      sampleValues: ['damaging_wind', 'large_hail', 'heavy_precipitation'],
    },
    'properties.hazards.values[].value[].phenomenon': {
      type: 'String',
      probability: 0.4,
      sampleValues: ['WND', 'HWY', 'LWX'],
    },
    'properties.hazards.values[].value[].significance': {
      type: 'String',
      probability: 0.4,
      sampleValues: ['W', 'A', 'Y'],
    },
    'properties.hazards.values[].value[].event_number': {
      type: 'Number',
      probability: 0.4,
      sampleValues: [1, 2, 3],
    },
  },
  expectedResponse: {
    fields: [
      {
        fieldPath: 'Id',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'Type',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Feature"]' }],
      },
      {
        fieldPath: 'properties.geometry',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.@id',
        fakerMethod: 'internet.url',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.@type',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["wx:Gridpoint"]' }],
      },
      {
        fieldPath: 'properties.updateTime',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.elevation.value',
        fakerMethod: 'number.int',
        fakerArgs: [{ json: JSON.stringify({ min: 500, max: 3000 }) }],
      },
      {
        fieldPath: 'properties.elevation.maxValue',
        fakerMethod: 'number.int',
        fakerArgs: [{ json: JSON.stringify({ min: 1000, max: 3500 }) }],
      },
      {
        fieldPath: 'properties.elevation.minValue',
        fakerMethod: 'number.int',
        fakerArgs: [{ json: JSON.stringify({ min: 100, max: 2000 }) }],
      },
      {
        fieldPath: 'properties.elevation.unitCode',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["wmoUnit:m"]' }],
      },
      {
        fieldPath: 'properties.elevation.qualityControl',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Z"]' }],
      },
      {
        fieldPath: 'properties.forecastOffice',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["ABQ", "PHX", "DEN"]' }],
      },
      {
        fieldPath: 'properties.gridId',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["ABQ", "PHX", "DEN"]' }],
      },
      {
        fieldPath: 'properties.gridX',
        fakerMethod: 'number.int',
        fakerArgs: [{ json: JSON.stringify({ min: 0, max: 200 }) }],
      },
      {
        fieldPath: 'properties.gridY',
        fakerMethod: 'number.int',
        fakerArgs: [{ json: JSON.stringify({ min: 0, max: 150 }) }],
      },
      {
        fieldPath: 'properties.weather.values[].value[].coverage',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [
          {
            json: '["areas", "scattered", "isolated", "chance"]',
          },
        ],
      },
      {
        fieldPath: 'properties.weather.values[].value[].weather',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [
          {
            json: '["blowing_dust", "rain", "snow", "thunderstorms"]',
          },
        ],
      },
      {
        fieldPath: 'properties.weather.values[].value[].intensity',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [
          {
            json: '["very_light", "light", "moderate", "heavy"]',
          },
        ],
      },
      {
        fieldPath: 'properties.weather.values[].value[].visibility.value',
        fakerMethod: 'number.int',
        fakerArgs: [{ json: JSON.stringify({ min: 500, max: 20000 }) }],
      },
      {
        fieldPath: 'properties.weather.values[].value[].visibility.maxValue',
        fakerMethod: 'number.int',
        fakerArgs: [{ json: JSON.stringify({ min: 1000, max: 25000 }) }],
      },
      {
        fieldPath: 'properties.weather.values[].value[].visibility.minValue',
        fakerMethod: 'number.int',
        fakerArgs: [{ json: JSON.stringify({ min: 0, max: 5000 }) }],
      },
      {
        fieldPath: 'properties.weather.values[].value[].visibility.unitCode',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["wmoUnit:m"]' }],
      },
      {
        fieldPath:
          'properties.weather.values[].value[].visibility.qualityControl',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Z"]' }],
      },
      {
        fieldPath: 'properties.weather.values[].value[].attributes[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [
          {
            json: '["damaging_wind", "large_hail", "heavy_precipitation"]',
          },
        ],
      },
      {
        fieldPath: 'properties.hazards.values[].value[].phenomenon',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["WND", "HWY", "LWX"]' }],
      },
      {
        fieldPath: 'properties.hazards.values[].value[].significance',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["W", "A", "Y"]' }],
      },
      {
        fieldPath: 'properties.hazards.values[].value[].event_number',
        fakerMethod: 'number.int',
        fakerArgs: [{ json: JSON.stringify({ min: 1, max: 10 }) }],
      },
    ],
  },
};

const weatherGridpointCaseWithoutSampleValues: MockDataGeneratorCaseConfig = {
  metadata: {
    name: 'Weather Gridpoint Example (no sample values)',
    hasSampleValues: false,
  },
  providedSchema: removeSampleValues(weatherGridpointCase.providedSchema),
  expectedResponse: {
    fields: [
      {
        fieldPath: 'Id',
        fakerMethod: IdlikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'Type',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.geometry',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.@id',
        fakerMethod: IdlikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.@type',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.updateTime',
        fakerMethod: DatelikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.elevation.value',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.elevation.maxValue',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.elevation.minValue',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.elevation.unitCode',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.elevation.qualityControl',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Z"]' }],
      },
      {
        fieldPath: 'properties.forecastOffice',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["DEN"]' }],
      },
      {
        fieldPath: 'properties.gridId',
        fakerMethod: IdlikeMethodCriterion,
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.gridX',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.gridY',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.weather.values[].value[].coverage',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.weather.values[].value[].weather',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.weather.values[].value[].intensity',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["light", "moderate", "heavy"]' }],
      },
      {
        fieldPath: 'properties.weather.values[].value[].visibility.value',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.weather.values[].value[].visibility.maxValue',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.weather.values[].value[].visibility.minValue',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.weather.values[].value[].visibility.unitCode',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath:
          'properties.weather.values[].value[].visibility.qualityControl',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Z"]' }],
      },
      {
        fieldPath: 'properties.weather.values[].value[].attributes[]',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.hazards.values[].value[].phenomenon',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.hazards.values[].value[].significance',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'properties.hazards.values[].value[].event_number',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
    ],
  },
};

// --- Mflix Movie Case ---

export const mflixMovieCase: MockDataGeneratorCaseConfig = {
  metadata: {
    name: 'Mflix Movie Example',
    hasSampleValues: true,
  },
  providedSchema: {
    title: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Scarface'],
    },
    plot: {
      type: 'String',
      probability: 1.0,
      sampleValues: [
        'An ambitious and near insanely violent gangster climbs the ladder of success in the mob, but his weaknesses prove to be his downfall.',
      ],
    },
    'genres[]': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Action', 'Crime', 'Drama'],
    },
    runtime: {
      type: 'Number',
      probability: 1.0,
      sampleValues: [93],
    },
    rated: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['PASSED'],
    },
    'cast[]': {
      type: 'String',
      probability: 1.0,
      sampleValues: [
        'Paul Muni',
        'Ann Dvorak',
        'Karen Morley',
        'Osgood Perkins',
      ],
    },
    num_mflix_comments: {
      type: 'Number',
      probability: 1.0,
      sampleValues: [1],
    },
    poster: {
      type: 'String',
      probability: 1.0,
      sampleValues: [
        'https://m.media-amazon.com/images/M/MV5BYmMxZTU2ZDUtM2Y1MS00ZWFmLWJlN2UtNzI0OTJiOTYzMTk3XkEyXkFqcGdeQXVyMjUxODE0MDY@._V1_SY1000_SX677_AL_.jpg',
      ],
    },
    fullplot: {
      type: 'String',
      probability: 1.0,
      sampleValues: [
        "Johnny Lovo rises to the head of the bootlegging crime syndicate on the south side of Chicago following the murder of former head, Big Louis Costillo. Johnny contracted Big Louis' bodyguard, Tony Camonte, to make the hit on his boss. Tony becomes Johnny's second in command. Johnny is not averse to killing anyone who gets in his and Johnny's way. As Tony is thinking bigger than Johnny and is not afraid of anyone or anything, Tony increasingly makes decisions on his own instead of following Johnny's orders, especially in not treading on the north side run by an Irish gang led by a man named O'Hara, of whom Johnny is afraid. Tony's murder spree increases, he taking out anyone who stands in his and Johnny's way of absolute control on the south side, and in Tony's view absolute control of the entire city. Tony's actions place an unspoken strain between Tony and Johnny to the point of the two knowing that they can't exist in their idealized world with the other. Tony's ultimate downfall may be one of two women in his life: Poppy, Johnny's girlfriend to who Tony is attracted; and Tony's eighteen year old sister, Cesca, who is self-professed to be older mentally than her years much to Tony's chagrin, he who will do anything to protect her innocence. Cesca ultimately comes to the realization that she is a lot more similar to her brother than she first imagined.",
      ],
    },
    'languages[]': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['English'],
    },
    released: {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['1932-01-01T00:00:00Z'],
    },
    'directors[]': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Howard Hawks', 'Richard Rosson'],
    },
    'writers[]': {
      type: 'String',
      probability: 1.0,
      sampleValues: [
        'Armitage Trail (novel)',
        'Ben Hecht (screen story)',
        'Seton I. Miller (continuity)',
        'John Lee Mahin (continuity)',
        'W.R. Burnett (continuity)',
        'Seton I. Miller (dialogue)',
        'John Lee Mahin (dialogue)',
        'W.R. Burnett (dialogue)',
      ],
    },
    'awards.wins': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [2],
    },
    'awards.nominations': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [0],
    },
    'awards.text': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['2 wins.'],
    },
    lastupdated: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['2015-09-03 00:32:16.227000000'],
    },
    year: {
      type: 'Number',
      probability: 1.0,
      sampleValues: [1932],
    },
    'imdb.rating': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [7.8],
    },
    'imdb.votes': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [18334],
    },
    'imdb.id': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [23427],
    },
    'countries[]': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['USA'],
    },
    type: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['movie'],
    },
    'tomatoes.viewer.rating': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [3.9],
    },
    'tomatoes.viewer.numReviews': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [25579],
    },
    'tomatoes.viewer.meter': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [86],
    },
    'tomatoes.dvd': {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2007-05-22T00:00:00.000Z'],
    },
    'tomatoes.critic.rating': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [8.7],
    },
    'tomatoes.critic.numReviews': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [34],
    },
    'tomatoes.critic.meter': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [100],
    },
    'tomatoes.lastUpdated': {
      type: 'Date',
      probability: 1.0,
      sampleValues: ['2015-09-14T19:30:50.000Z'],
    },
    'tomatoes.rotten': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [0],
    },
    'tomatoes.production': {
      type: 'String',
      probability: 1.0,
      sampleValues: ['Universal Pictures'],
    },
    'tomatoes.fresh': {
      type: 'Number',
      probability: 1.0,
      sampleValues: [34],
    },
  },
  expectedResponse: {
    fields: [
      {
        fieldPath: 'title',
        fakerMethod: 'lorem.lines',
        fakerArgs: [],
      },
      {
        fieldPath: 'plot',
        fakerMethod: 'lorem.sentence',
        fakerArgs: [],
      },
      {
        fieldPath: 'genres[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Action", "Crime", "Drama"]' }],
      },
      {
        fieldPath: 'runtime',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'rated',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["PASSED"]' }],
      },
      {
        fieldPath: 'cast[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [
          {
            json: '["Paul Muni", "Ann Dvorak", "Karen Morley", "Osgood Perkins"]',
          },
        ],
      },
      {
        fieldPath: 'num_mflix_comments',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'poster',
        fakerMethod: 'image.url',
        fakerArgs: [],
      },
      {
        fieldPath: 'fullplot',
        fakerMethod: 'lorem.paragraph',
        fakerArgs: [],
      },
      {
        fieldPath: 'languages[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["English"]' }],
      },
      {
        fieldPath: 'released',
        fakerMethod: 'date.recent',
        fakerArgs: [],
      },
      {
        fieldPath: 'directors[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Howard Hawks", "Richard Rosson"]' }],
      },
      {
        fieldPath: 'writers[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [
          {
            json: '["Armitage Trail (novel)", "Ben Hecht (screen story)", "Seton I. Miller (continuity)", "John Lee Mahin (continuity)", "W.R. Burnett (continuity)", "Seton I. Miller (dialogue)", "John Lee Mahin (dialogue)", "W.R. Burnett (dialogue)"]',
          },
        ],
      },
      {
        fieldPath: 'awards.wins',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'awards.nominations',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'awards.text',
        fakerMethod: 'lorem.sentence',
        fakerArgs: [],
      },
      {
        fieldPath: 'lastupdated',
        fakerMethod: 'date.recent',
        fakerArgs: [],
      },
      {
        fieldPath: 'year',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'imdb.rating',
        fakerMethod: 'number.float',
        fakerArgs: [],
      },
      {
        fieldPath: 'imdb.votes',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'imdb.id',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'countries[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["USA"]' }],
      },
      {
        fieldPath: 'type',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["movie"]' }],
      },
      {
        fieldPath: 'tomatoes.viewer.rating',
        fakerMethod: 'number.float',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.viewer.numReviews',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.viewer.meter',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.dvd',
        fakerMethod: 'date.recent',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.critic.rating',
        fakerMethod: 'number.float',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.critic.numReviews',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.critic.meter',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.lastUpdated',
        fakerMethod: 'date.recent',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.rotten',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.production',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Universal Pictures"]' }],
      },
      {
        fieldPath: 'tomatoes.fresh',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
    ],
  },
};

const mflixMovieCaseWithoutSampleValues: MockDataGeneratorCaseConfig = {
  metadata: {
    name: 'Mflix Movie Example (no sample values)',
    hasSampleValues: false,
  },
  providedSchema: removeSampleValues(mflixMovieCase.providedSchema),
  expectedResponse: {
    fields: [
      {
        fieldPath: 'title',
        fakerMethod: 'lorem.lines',
        fakerArgs: [],
      },
      {
        fieldPath: 'plot',
        fakerMethod: 'lorem.sentence',
        fakerArgs: [],
      },
      {
        fieldPath: 'genres[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Mystery", "Drama", "Romance"]' }],
      },
      {
        fieldPath: 'runtime',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'rated',
        fakerMethod: 'string.alphanumeric',
        fakerArgs: [],
      },
      {
        fieldPath: 'cast[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Ryan Gosling"]' }],
      },
      {
        fieldPath: 'num_mflix_comments',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'poster',
        fakerMethod: 'image.url',
        fakerArgs: [],
      },
      {
        fieldPath: 'fullplot',
        fakerMethod: 'lorem.paragraph',
        fakerArgs: [],
      },
      {
        fieldPath: 'languages[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["EN", "SP", "FR", "JP", "DE"]' }],
      },
      {
        fieldPath: 'released',
        fakerMethod: 'date.recent',
        fakerArgs: [],
      },
      {
        fieldPath: 'directors[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Steven Spielberg"]' }],
      },
      {
        fieldPath: 'writers[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["Ben Hecht"]' }],
      },
      {
        fieldPath: 'awards.wins',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'awards.nominations',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'awards.text',
        fakerMethod: 'lorem.sentence',
        fakerArgs: [],
      },
      {
        fieldPath: 'lastupdated',
        fakerMethod: 'date.recent',
        fakerArgs: [],
      },
      {
        fieldPath: 'year',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'imdb.rating',
        fakerMethod: 'number.float',
        fakerArgs: [],
      },
      {
        fieldPath: 'imdb.votes',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'imdb.id',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'countries[]',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [
          {
            json: '["US", "UK", "CA", "AU", "NZ", "PH", "BR", "MX", "KR"]',
          },
        ],
      },
      {
        fieldPath: 'type',
        fakerMethod: 'helpers.arrayElement',
        fakerArgs: [{ json: '["movie"]' }],
      },
      {
        fieldPath: 'tomatoes.viewer.rating',
        fakerMethod: 'number.float',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.viewer.numReviews',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.viewer.meter',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.dvd',
        fakerMethod: 'date.recent',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.critic.rating',
        fakerMethod: 'number.float',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.critic.numReviews',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.critic.meter',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.lastUpdated',
        fakerMethod: 'date.recent',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.rotten',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.production',
        fakerMethod: 'company.name',
        fakerArgs: [],
      },
      {
        fieldPath: 'tomatoes.fresh',
        fakerMethod: 'number.int',
        fakerArgs: [],
      },
    ],
  },
};

export const mockDataEvalCases: Array<MockDataGeneratorCaseConfig> = [
  simpleCase,
  chargeCreditCase,
  chargeCreditCaseWithoutSampleValues,
  ecommerceCase,
  fundingEventCase,
  fundingEventCaseWithoutSampleValues,
  weatherGridpointCase,
  weatherGridpointCaseWithoutSampleValues,
  mflixMovieCase,
  mflixMovieCaseWithoutSampleValues,
];
