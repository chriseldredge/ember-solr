import stringify from 'ember-solr/lib/big-number-stringify';

import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('adapter:solr', 'BigNumberStringify');

test('object', function(assert) {
  var result = stringify({ a: 'b', x: 'q'});

  assert.equal(result, '{"a":"b","x":"q"}');
});

test('array', function(assert) {
  var result = stringify([1, 5]);

  assert.equal(result, '[1,5]');
});

test('date', function(assert) {
  var date = new Date();

  var result = stringify(date);

  assert.equal(result, JSON.stringify(date));
});

test('BigNumber', function(assert) {
  var data = { a: new BigNumber('1231242354134534523412342353453242315345234')};
  var result = stringify(data);

  assert.equal(result, '{"a":' + data.a.toString() + '}');
});

test('complex', function(assert) {
  var data = {
    a: [{d: 'd1'}, {d: 'd2'}],
    s: 'a string',
    i: 123,
    f: 45.67,
    d: new Date(),
    n: new BigNumber('3434534634534235346456435345345234634534523452')
  };

  var result = stringify(data);

  assert.equal(result, '{"a":[{"d":"d1"},{"d":"d2"}],"s":"a string","i":123,"f":45.67,"d":' + JSON.stringify(data.d) + ',"n":3434534634534235346456435345345234634534523452}');
});
