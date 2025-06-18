# Shared Schemas

## Overview
The `shared_schema` directory contains foundational, domain-agnostic schemas that can be reused and extended across different domains of the application. These schemas represent core business concepts that maintain consistency across various features.

## Architecture Decisions

### Why Shared Schemas?
1. **Reusability**: Core business concepts are defined once and reused across domains
2. **Consistency**: Ensures uniform behavior and validation across the application
3. **Maintainability**: Changes to core concepts happen in one place
4. **Flexibility**: New domains can easily incorporate existing functionality
5. **Type Safety**: Shared schemas provide a single source of truth for types

### Schema Categories

#### Current Schemas
- `ticketing.schema.js`: Base schema for all ticket-related functionality
  - Used by: Events, Conferences, Workshops
  - Handles: Pricing, Usage, Purchase tracking

#### Planned Schemas

1. **Payment Schemas**
```javascript
payment/
├── transaction.schema.js    // Base transaction record
├── pricing.schema.js       // Price tiers and calculations
├── credit.schema.js        // Credit system operations
└── refund.schema.js        // Refund processing
```

2. **User Interaction Schemas**
```javascript
interaction/
├── rating.schema.js        // User ratings and reviews
├── comment.schema.js       // Threaded comments
├── reaction.schema.js      // User reactions (likes, etc.)
└── notification.schema.js  // User notifications
```

3. **Media Schemas**
```javascript
media/
├── image.schema.js         // Image metadata and processing
├── video.schema.js         // Video content handling
├── document.schema.js      // Document management
└── attachment.schema.js    // General file attachments
```

4. **Location Schemas**
```javascript
location/
├── address.schema.js       // Physical addresses
├── coordinates.schema.js   // Geo-coordinates
├── venue.schema.js         // Venue information
└── region.schema.js        // Geographic regions
```

5. **Time Schemas**
```javascript
scheduling/
├── timeSlot.schema.js      // Time slot management
├── availability.schema.js  // Resource availability
├── calendar.schema.js      // Calendar operations
└── recurrence.schema.js    // Recurring events
```

## Usage Patterns

### Basic Extension
```javascript
import { TicketSchema } from '../lib/shared_schema/ticketing.schema.js';

const EventTicketSchema = new Schema({
  ...TicketSchema.obj,
  // Event-specific additions
  seatNumber: String,
  section: String
});
```

### Composition
```javascript
import { AddressSchema } from '../lib/shared_schema/location/address.schema.js';
import { TimeSlotSchema } from '../lib/shared_schema/scheduling/timeSlot.schema.js';

const VenueSchema = new Schema({
  name: String,
  location: AddressSchema,
  operatingHours: [TimeSlotSchema]
});
```

### Validation Reuse
```javascript
import { addressValidators } from '../lib/validators/address.validators.js';

const CustomLocationSchema = new Schema({
  address: {
    type: String,
    ...addressValidators.streetAddress
  }
});
```

## Best Practices

1. **Schema Evolution**
   - Keep shared schemas focused and domain-agnostic
   - Use versioning for breaking changes
   - Document all schema changes

2. **Validation**
   - Define validators in separate files
   - Share validators between Mongoose and GraphQL
   - Use TypeScript interfaces when possible

3. **Testing**
   - Test shared schemas in isolation
   - Test schema composition
   - Verify backward compatibility

4. **Documentation**
   - Document all schema fields
   - Provide usage examples
   - Explain validation rules

## Adding New Shared Schemas

When adding a new shared schema:

1. Evaluate if the concept is truly domain-agnostic
2. Create corresponding validators
3. Add GraphQL type composers
4. Write comprehensive tests
5. Document usage patterns
6. Update this README

## Migration Guide

When migrating existing domain-specific schemas to shared schemas:

1. Identify common patterns across domains
2. Extract shared functionality
3. Create base schema
4. Update existing implementations
5. Add tests for new use cases

## Future Considerations

1. **Schema Registry**
   - Central registry of all shared schemas
   - Automatic documentation generation
   - Schema dependency tracking

2. **Code Generation**
   - Generate TypeScript types
   - Generate GraphQL types
   - Generate validation rules

3. **Monitoring**
   - Track schema usage
   - Performance metrics
   - Breaking change detection 