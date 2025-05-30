import { schemaComposer } from 'graphql-compose';

export function addOneToManyRelation(SourceTC, TargetTC, sourceField, targetField, fieldName, resolverOpts = {}) {
  SourceTC.addRelation(fieldName, {
    resolver: () => TargetTC.mongooseResolvers.findMany(resolverOpts),
    prepareArgs: {
      filter: (source) => ({
        [targetField]: source[sourceField]
      }),
    },
    projection: {
      [sourceField]: 1
    },
  });
}

export function addManyToOneRelation(SourceTC, TargetTC, sourceField, targetField, fieldName, resolverOpts = {}) {
  SourceTC.addRelation(fieldName, {
    resolver: () => TargetTC.mongooseResolvers.findById(resolverOpts), // Using findById for many-to-one
    prepareArgs: {
      _id: (source) => source[sourceField],
    },
    projection: {
      [sourceField]: 1
    },
  });
}

// Add other wrapper functions as needed (e.g., one-to-one, many-to-many) 