// // Examples of schema definitions using the 's' schema builder

// // Import the schema builder
// import { s } from './core';

// // Basic primitive types
// const numberSchema = s.number();
// const stringSchema = s.string();
// const booleanSchema = s.boolean();
// const dateSchema = s.date();

// // Arrays of primitives
// const numberArraySchema = s.array<number>();
// const stringArraySchema = s.array<string>();
// const dateArraySchema = s.array<Date>();

// // Schema types with modifiers
// // -------------------------------

// // String with modifiers
// const optionalString = s.string().optional();
// const nullableString = s.string().nullable();
// const readonlyString = s.string().readonly();
// const stringWithDefault = s.string().default('default value');
// const keyString = s.string().key();
// const identityString = s.string().identity();
// const serializedString = s.string().serialize(val => val.toLowerCase());
// const deserializedString = s.string().deserialize(val => val.toString().trim());

// // Combined string modifiers
// const complexString = s.string()
//   .optional()
//   .default('example@example.com')
//   .readonly();

// // Number with modifiers
// const optionalNumber = s.number().optional();
// const nullableNumber = s.number().nullable();
// const readonlyNumber = s.number().readonly();
// const numberWithDefault = s.number().default(0);
// const keyNumber = s.number().key();
// const identityNumber = s.number().identity();
// const serializedNumber = s.number().serialize(val => Math.floor(val));
// const deserializedNumber = s.number().deserialize(val => parseInt(val.toString()));

// // Combined number modifiers
// const complexNumber = s.number()
//   .optional()
//   .default(1)
//   .readonly();

// // Boolean with modifiers
// const optionalBoolean = s.boolean().optional();
// const nullableBoolean = s.boolean().nullable();
// const readonlyBoolean = s.boolean().readonly();
// const booleanWithDefault = s.boolean().default(false);
// const serializedBoolean = s.boolean().serialize(val => val ? 1 : 0);
// const deserializedBoolean = s.boolean().deserialize(val => Boolean(val));

// // Date with modifiers
// const optionalDate = s.date().optional();
// const nullableDate = s.date().nullable();
// const readonlyDate = s.date().readonly();
// const dateWithDefault = s.date().default(new Date());
// const serializedDate = s.date().serialize(val => val.getTime());
// const deserializedDate = s.date().deserialize(val => new Date(val));

// // Array with modifiers
// const optionalArray = s.array<string>().optional();
// const nullableArray = s.array<number>().nullable();
// const arrayWithDefault = s.array<boolean>().default([]);
// const serializedArray = s.array<number>().serialize(val => val.join(','));
// const deserializedArray = s.array<string>().deserialize(val => val.toString().split(','));

// // Object with modifiers
// const optionalObject = s.object({ name: s.string() }).optional();
// const nullableObject = s.object({ age: s.number() }).nullable();
// const objectWithDefault = s.object({ isActive: s.boolean() }).default({ isActive: true });
// const identityObject = s.object({ id: s.number().identity() }).identity();

// // Combination examples with multiple modifiers
// // --------------------------------------------

// // User model with various modifiers
// const advancedUserSchema = s.define('advanced_users', {
//   id: s.number().identity().readonly(),
//   username: s.string().key(),
//   email: s.string().readonly(),
//   firstName: s.string().optional(),
//   lastName: s.string().optional(),
//   fullName: s.string().serialize(val => val.toUpperCase())
//               .deserialize(val => val.toString().toLowerCase()),
//   password: s.string().serialize(val => '*****'), // Don't expose in serialization
//   age: s.number().nullable(),
//   isActive: s.boolean().default(true),
//   role: s.string().default('user'),
//   createdAt: s.date().default(() => new Date()).readonly(),
//   lastLogin: s.date().nullable(),
//   settings: s.object({
//     theme: s.string().default('light'),
//     notifications: s.boolean().default(true),
//     language: s.string().default('en')
//   }).nullable(),
//   friends: s.array<number>().default([]),
//   tags: s.array<string>().optional()
// });

// // Product schema with modifiers for e-commerce application
// const advancedProductSchema = s.define('advanced_products', {
//   id: s.number().identity().readonly(),
//   sku: s.string().key().readonly(),
//   name: s.string(),
//   description: s.string().nullable(),
//   slug: s.string().serialize(val => val.toLowerCase().replace(/\s+/g, '-')),
//   price: s.number().serialize(val => (val / 100).toFixed(2))
//                   .deserialize(val => Math.round(parseFloat(val.toString()) * 100)),
//   salePrice: s.number().nullable(),
//   cost: s.number().nullable(),
//   isOnSale: s.boolean().default(false),
//   isPublished: s.boolean().default(false),
//   publishDate: s.date().nullable(),
//   createdAt: s.date().default(() => new Date()).readonly(),
//   modifiedAt: s.date().default(() => new Date()),
//   categories: s.array<string>().default([]),
//   tags: s.array<string>().default([]),
//   images: s.array<{
//     url: string,
//     alt: string,
//     isDefault: boolean
//   }>().default([]),
//   attributes: s.object({
//     color: s.string().nullable(),
//     size: s.string().nullable(),
//     weight: s.number().nullable(),
//     material: s.string().nullable()
//   }).nullable(),
//   inventory: s.object({
//     quantity: s.number().default(0),
//     warehouse: s.string().nullable(),
//     reorderLevel: s.number().nullable(),
//     isBackorderable: s.boolean().default(false)
//   })
// });

// // Blog post with rich content and relationship handling
// const advancedBlogPostSchema = s.define('advanced_blog_posts', {
//   id: s.number().identity().readonly(),
//   title: s.string(),
//   slug: s.string().serialize(val => val.toLowerCase().replace(/\s+/g, '-')),
//   content: s.string(),
//   excerpt: s.string().nullable().default(function(this: any) {
//     // Example of a computed default using a function
//     return this.content ? this.content.substring(0, 150) + '...' : '';
//   }),
//   status: s.string().default('draft'), // draft, published, archived
//   authorId: s.number().key(),
//   createdAt: s.date().default(() => new Date()).readonly(),
//   publishedAt: s.date().nullable(),
//   updatedAt: s.date().default(() => new Date()),
//   readTime: s.number().nullable().serialize(val => val ? `${val} min read` : null),
//   viewCount: s.number().default(0),
//   likeCount: s.number().default(0),
//   isFeatured: s.boolean().default(false),
//   categories: s.array<{
//     id: number,
//     name: string
//   }>().default([]),
//   tags: s.array<string>().default([]),
//   comments: s.array<{
//     id: number,
//     authorId: number,
//     content: string,
//     createdAt: Date,
//     isApproved: boolean
//   }>().default([]),
//   seo: s.object({
//     title: s.string().nullable(),
//     description: s.string().nullable(),
//     keywords: s.array<string>().default([]),
//     ogImage: s.string().nullable()
//   }).nullable().default({
//     title: null,
//     description: null,
//     keywords: [],
//     ogImage: null
//   })
// });

// // Event schema with complex time handling and nested objects
// const advancedEventSchema = s.define('advanced_events', {
//   id: s.number().identity().readonly(),
//   name: s.string(),
//   slug: s.string().serialize(val => val.toLowerCase().replace(/\s+/g, '-')),
//   description: s.string().nullable(),
//   startDate: s.date(),
//   endDate: s.date(),
//   timezone: s.string().default('UTC'),
//   isAllDay: s.boolean().default(false),
//   recurrence: s.object({
//     type: s.string().nullable(), // none, daily, weekly, monthly, yearly
//     interval: s.number().default(1),
//     endDate: s.date().nullable(),
//     daysOfWeek: s.array<number>().nullable(), // 0 = Sunday, 6 = Saturday
//     exceptions: s.array<Date>().default([])
//   }).nullable(),
//   location: s.object({
//     name: s.string().nullable(),
//     address: s.string().nullable(),
//     city: s.string().nullable(),
//     state: s.string().nullable(),
//     country: s.string().nullable(),
//     postalCode: s.string().nullable(),
//     isVirtual: s.boolean().default(false),
//     meetingUrl: s.string().nullable(),
//     coordinates: s.object({
//       latitude: s.number().nullable(),
//       longitude: s.number().nullable()
//     }).nullable()
//   }),
//   organizer: s.object({
//     id: s.number().key(),
//     name: s.string(),
//     email: s.string().nullable(),
//     phone: s.string().nullable()
//   }),
//   capacity: s.number().nullable(),
//   attendeeCount: s.number().default(0),
//   status: s.string().default('scheduled'), // scheduled, canceled, completed
//   visibility: s.string().default('public'), // public, private, unlisted
//   categories: s.array<string>().default([]),
//   tags: s.array<string>().default([]),
//   createdAt: s.date().default(() => new Date()).readonly(),
//   updatedAt: s.date().default(() => new Date()),
//   isFeatured: s.boolean().default(false),
//   attachments: s.array<{
//     name: string,
//     url: string,
//     type: string,
//     size: number
//   }>().default([]),
//   ticketTypes: s.array<{
//     id: number,
//     name: string,
//     description: string,
//     price: number,
//     quantity: number,
//     available: number,
//     startSaleDate: Date,
//     endSaleDate: Date
//   }>().default([])
// });

// // Example for an order processing system with complex relationships
// const advancedOrderSchema = s.define('advanced_orders', {
//   id: s.number().identity().readonly(),
//   orderNumber: s.string().key().serialize(val => `ORD-${val}`),
//   customerId: s.number().key(),
//   status: s.string().default('pending'), // pending, processing, shipped, delivered, canceled
//   createdAt: s.date().default(() => new Date()).readonly(),
//   updatedAt: s.date().default(() => new Date()),
//   completedAt: s.date().nullable(),
//   canceledAt: s.date().nullable(),
//   subtotal: s.number().default(0)
//             .serialize(val => (val / 100).toFixed(2))
//             .deserialize(val => Math.round(parseFloat(val.toString()) * 100)),
//   taxAmount: s.number().default(0)
//             .serialize(val => (val / 100).toFixed(2))
//             .deserialize(val => Math.round(parseFloat(val.toString()) * 100)),
//   shippingAmount: s.number().default(0)
//                   .serialize(val => (val / 100).toFixed(2))
//                   .deserialize(val => Math.round(parseFloat(val.toString()) * 100)),
//   discountAmount: s.number().default(0)
//                   .serialize(val => (val / 100).toFixed(2))
//                   .deserialize(val => Math.round(parseFloat(val.toString()) * 100)),
//   totalAmount: s.number().default(0)
//               .serialize(val => (val / 100).toFixed(2))
//               .deserialize(val => Math.round(parseFloat(val.toString()) * 100)),
//   currency: s.string().default('USD'),
//   paymentMethod: s.string().nullable(),
//   paymentStatus: s.string().default('pending'), // pending, paid, failed, refunded
//   transactionId: s.string().nullable(),
//   lineItems: s.array<{
//     id: number,
//     productId: number,
//     sku: string,
//     name: string,
//     quantity: number,
//     unitPrice: number,
//     subtotal: number,
//     taxAmount: number,
//     discountAmount: number,
//     totalAmount: number,
//     metadata: {
//       [key: string]: any
//     }
//   }>().default([]),
//   billingAddress: s.object({
//     firstName: s.string(),
//     lastName: s.string(),
//     company: s.string().nullable(),
//     address1: s.string(),
//     address2: s.string().nullable(),
//     city: s.string(),
//     state: s.string(),
//     postalCode: s.string(),
//     country: s.string(),
//     phone: s.string().nullable(),
//     email: s.string()
//   }),
//   shippingAddress: s.object({
//     firstName: s.string(),
//     lastName: s.string(),
//     company: s.string().nullable(),
//     address1: s.string(),
//     address2: s.string().nullable(),
//     city: s.string(),
//     state: s.string(),
//     postalCode: s.string(),
//     country: s.string(),
//     phone: s.string().nullable(),
//   }).nullable(),
//   shippingMethod: s.string().nullable(),
//   trackingNumber: s.string().nullable(),
//   notes: s.string().nullable(),
//   metadata: s.object({
//     [key: string]: any
//   }).default({}),
//   discounts: s.array<{
//     code: string,
//     type: string, // percentage, fixed
//     amount: number,
//     description: string
//   }>().default([]),
//   refunds: s.array<{
//     id: number,
//     amount: number,
//     reason: string,
//     transactionId: string,
//     createdAt: Date
//   }>().default([])
// });

// // User account with permissions and authentication schema
// const advancedUserAccountSchema = s.define('advanced_user_accounts', {
//   id: s.number().identity().readonly(),
//   email: s.string().key(),
//   username: s.string().nullable(),
//   passwordHash: s.string().readonly().serialize(val => '[REDACTED]'), // Never expose in serialization
//   salt: s.string().readonly().serialize(val => '[REDACTED]'),
//   firstName: s.string().nullable(),
//   lastName: s.string().nullable(),
//   displayName: s.string().nullable(),
//   avatar: s.string().nullable(),
//   phone: s.string().nullable(),
//   isEmailVerified: s.boolean().default(false),
//   isPhoneVerified: s.boolean().default(false),
//   isActive: s.boolean().default(true),
//   createdAt: s.date().default(() => new Date()).readonly(),
//   updatedAt: s.date().default(() => new Date()),
//   lastLoginAt: s.date().nullable(),
//   passwordChangedAt: s.date().nullable(),
//   passwordResetToken: s.string().nullable().serialize(val => '[REDACTED]'),
//   passwordResetExpires: s.date().nullable(),
//   emailVerificationToken: s.string().nullable().serialize(val => '[REDACTED]'),
//   phoneVerificationToken: s.string().nullable().serialize(val => '[REDACTED]'),
//   twoFactorEnabled: s.boolean().default(false),
//   twoFactorSecret: s.string().nullable().serialize(val => '[REDACTED]'),
//   recoveryBackupCodes: s.array<string>().default([]).serialize(val => '[REDACTED]'),
//   role: s.string().default('user'), // user, admin, etc.
//   permissions: s.array<string>().default([]),
//   preferences: s.object({
//     theme: s.string().default('light'),
//     language: s.string().default('en'),
//     timezone: s.string().default('UTC'),
//     emailNotifications: s.boolean().default(true),
//     smsNotifications: s.boolean().default(false)
//   }).default({
//     theme: 'light',
//     language: 'en',
//     timezone: 'UTC',
//     emailNotifications: true,
//     smsNotifications: false
//   }),
//   sessions: s.array<{
//     id: string,
//     userAgent: string,
//     ipAddress: string,
//     lastActivity: Date,
//     isActive: boolean
//   }>().default([]),
//   loginAttempts: s.number().default(0),
//   lockedUntil: s.date().nullable(),
//   oauth: s.object({
//     google: s.object({
//       id: s.string().nullable(),
//       token: s.string().nullable().serialize(val => '[REDACTED]'),
//       email: s.string().nullable()
//     }).nullable(),
//     facebook: s.object({
//       id: s.string().nullable(),
//       token: s.string().nullable().serialize(val => '[REDACTED]'),
//       email: s.string().nullable()
//     }).nullable(),
//     twitter: s.object({
//       id: s.string().nullable(),
//       token: s.string().nullable().serialize(val => '[REDACTED]'),
//       username: s.string().nullable()
//     }).nullable()
//   }).nullable()
// });

// // Simple object schemas
// const addressSchema = s.object({
//   street: s.string(),
//   city: s.string(),
//   zipCode: s.string(),
//   country: s.string()
// });

// const contactSchema = s.object({
//   email: s.string(),
//   phone: s.string()
// });

// // Nested objects
// const personSchema = s.object({
//   firstName: s.string(),
//   lastName: s.string(),
//   age: s.number(),
//   isActive: s.boolean(),
//   address: addressSchema,
//   contact: contactSchema
// });

// // Arrays of objects
// const peopleSchema = s.array<typeof personSchema>();

// // Table definition for a simple entity
// const userTable = s.define('users', {
//   id: s.number(),
//   username: s.string(),
//   email: s.string(),
//   password: s.string(),
//   createdAt: s.date()
// });

// // Table with relationships and more complex structure
// const productTable = s.define('products', {
//   id: s.number(),
//   name: s.string(),
//   description: s.string(),
//   price: s.number(),
//   inStock: s.boolean(),
//   createdAt: s.date(),
//   tags: s.array<string>(),
//   metadata: s.object({
//     manufacturer: s.string(),
//     weight: s.number(),
//     dimensions: s.object({
//       width: s.number(),
//       height: s.number(),
//       depth: s.number()
//     })
//   })
// });

// // Order table with relationships
// const orderTable = s.define('orders', {
//   id: s.number(),
//   userId: s.number(),
//   orderDate: s.date(),
//   status: s.string(),
//   items: s.array<{
//     productId: number,
//     quantity: number,
//     unitPrice: number
//   }>(),
//   shippingAddress: s.object({
//     street: s.string(),
//     city: s.string(),
//     zipCode: s.string(),
//     country: s.string()
//   }),
//   payment: s.object({
//     method: s.string(),
//     transactionId: s.string(),
//     amount: s.number(),
//     currency: s.string(),
//     isPaid: s.boolean(),
//     paidAt: s.date()
//   })
// });

// // Example with method chaining (if supported)
// // Note: This syntax is hypothetical as the exact API isn't fully shown in the typings
// const customerSchema = s.define('customers', {
//   id: s.number(), // Basic number
//   firstName: s.string(), // Basic string
//   lastName: s.string(),
//   email: s.string(),
//   phoneNumber: s.string(),
//   birthDate: s.date(),
//   isVerified: s.boolean(),
//   registrationDate: s.date(),
//   lastLoginDate: s.date(),
//   preferences: s.object({
//     newsletter: s.boolean(),
//     theme: s.string(),
//     language: s.string()
//   }),
//   addresses: s.array<{
//     type: string,
//     street: string,
//     city: string,
//     state: string,
//     zipCode: string,
//     country: string,
//     isDefault: boolean
//   }>(),
//   orders: s.array<number>(), // Array of order IDs
//   loyaltyPoints: s.number(),
//   notes: s.string(),
//   tags: s.array<string>()
// });

// // Example of a blog post schema
// const blogPostSchema = s.define('blogPosts', {
//   id: s.number(),
//   title: s.string(),
//   slug: s.string(),
//   content: s.string(),
//   excerpt: s.string(),
//   authorId: s.number(),
//   publishDate: s.date(),
//   isPublished: s.boolean(),
//   categories: s.array<string>(),
//   tags: s.array<string>(),
//   featuredImage: s.string(),
//   comments: s.array<{
//     id: number,
//     userId: number,
//     content: string,
//     createdAt: Date,
//     isApproved: boolean
//   }>(),
//   metadata: s.object({
//     views: s.number(),
//     likes: s.number(),
//     readTime: s.number()
//   })
// });

// // Example of an e-commerce inventory system
// const inventorySchema = s.define('inventory', {
//   productId: s.number(),
//   warehouseId: s.number(),
//   quantity: s.number(),
//   location: s.object({
//     aisle: s.string(),
//     shelf: s.string(),
//     bin: s.string()
//   }),
//   lastUpdated: s.date(),
//   status: s.string(),
//   movements: s.array<{
//     date: Date,
//     type: string, // 'in' or 'out'
//     quantity: number,
//     reason: string,
//     performedBy: number // userId
//   }>()
// });

// // Event schema for an event management system
// const eventSchema = s.define('events', {
//   id: s.number(),
//   name: s.string(),
//   description: s.string(),
//   startDate: s.date(),
//   endDate: s.date(),
//   location: s.object({
//     name: s.string(),
//     address: s.string(),
//     city: s.string(),
//     country: s.string(),
//     coordinates: s.object({
//       latitude: s.number(),
//       longitude: s.number()
//     })
//   }),
//   organizer: s.object({
//     id: s.number(),
//     name: s.string(),
//     email: s.string(),
//     phone: s.string()
//   }),
//   ticketTypes: s.array<{
//     id: number,
//     name: string,
//     price: number,
//     quantity: number,
//     availableUntil: Date
//   }>(),
//   attendees: s.array<number>(), // Array of user IDs
//   isPublic: s.boolean(),
//   categories: s.array<string>(),
//   tags: s.array<string>(),
//   status: s.string() // 'planned', 'ongoing', 'completed', 'cancelled'
// });

// // Export the examples for use elsewhere
// export {
//   // Basic types
//   numberSchema,
//   stringSchema,
//   booleanSchema,
//   dateSchema,
//   numberArraySchema,
//   stringArraySchema,
//   dateArraySchema,
  
//   // String modifiers
//   optionalString,
//   nullableString,
//   readonlyString,
//   stringWithDefault,
//   keyString,
//   identityString,
//   serializedString,
//   deserializedString,
//   complexString,
  
//   // Number modifiers
//   optionalNumber,
//   nullableNumber,
//   readonlyNumber,
//   numberWithDefault,
//   keyNumber,
//   identityNumber,
//   serializedNumber,
//   deserializedNumber,
//   complexNumber,
  
//   // Boolean modifiers
//   optionalBoolean,
//   nullableBoolean,
//   readonlyBoolean,
//   booleanWithDefault,
//   serializedBoolean,
//   deserializedBoolean,
  
//   // Date modifiers
//   optionalDate,
//   nullableDate,
//   readonlyDate,
//   dateWithDefault,
//   serializedDate,
//   deserializedDate,
  
//   // Array modifiers
//   optionalArray,
//   nullableArray,
//   arrayWithDefault,
//   serializedArray,
//   deserializedArray,
  
//   // Object modifiers
//   optionalObject,
//   nullableObject,
//   objectWithDefault,
//   identityObject,
  
//   // Advanced schemas
//   advancedUserSchema,
//   advancedProductSchema,
//   advancedBlogPostSchema,
//   advancedEventSchema,
//   advancedOrderSchema,
//   advancedUserAccountSchema,
  
//   // Original schemas
//   addressSchema,
//   contactSchema,
//   personSchema,
//   peopleSchema,
//   userTable,
//   productTable,
//   orderTable,
//   customerSchema,
//   blogPostSchema,
//   inventorySchema,
//   eventSchema
// }; 