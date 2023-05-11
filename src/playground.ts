import { GlKidIcon as component } from './__fixtures__/components/kid-icon';
const properties = Reflect.ownKeys(component.prototype).filter(key => key !== 'constructor');
const methods = Reflect.ownKeys(component.prototype.constructor).filter(key => key !== 'prototype' && key !== 'name');

const json = {
      name: 'my-component',
      properties: properties,
      methods: methods
};

console.log(JSON.stringify(json));