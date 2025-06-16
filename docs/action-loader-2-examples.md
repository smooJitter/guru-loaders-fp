# Action Loader 2 – Example Action Files

This guide shows full `.action.js` file examples for `action-loader-2`, each featuring 3–4 actions and demonstrating different supported export patterns. All examples are self-contained and follow best practices.

---

## 1. Factory Export (Recommended)

```js
// user.actions.js
export default (context) => ({
  user: {
    create: {
      method: async ({ context, userData }) => {
        // ...create user logic
      },
      meta: { audit: true }
    },
    update: {
      method: async ({ context, userId, updates }) => {
        // ...update user logic
      },
      meta: { audit: true }
    },
    findByEmail: {
      method: async ({ context, email }) => {
        // ...find user by email logic
      },
      meta: { cache: true }
    },
    delete: {
      method: async ({ context, userId }) => {
        // ...delete user logic
      },
      meta: { requiresAdmin: true }
    }
  }
});
```

---

## 2. Array Export

```js
// post.actions.js
export default [
  {
    namespace: 'post',
    name: 'create',
    method: async ({ context, postData }) => {
      // ...create post logic
    },
    meta: { audit: true }
  },
  {
    namespace: 'post',
    name: 'update',
    method: async ({ context, postId, updates }) => {
      // ...update post logic
    },
    meta: { audit: true }
  },
  {
    namespace: 'post',
    name: 'list',
    method: async ({ context, page = 1, limit = 10 }) => {
      // ...list posts logic
    },
    meta: { cache: true }
  },
  {
    namespace: 'post',
    name: 'delete',
    method: async ({ context, postId }) => {
      // ...delete post logic
    },
    meta: { requiresAdmin: true }
  }
];
```

---

## 3. Object Export

```js
// comment.actions.js
export default {
  comment: {
    add: {
      method: async ({ context, postId, commentData }) => {
        // ...add comment logic
      },
      meta: { audit: true }
    },
    update: {
      method: async ({ context, commentId, updates }) => {
        // ...update comment logic
      },
      meta: { audit: true }
    },
    listByPost: {
      method: async ({ context, postId }) => {
        // ...list comments for a post
      },
      meta: { cache: true }
    },
    delete: {
      method: async ({ context, commentId }) => {
        // ...delete comment logic
      },
      meta: { requiresAdmin: true }
    }
  }
};
```

---

## 4. Mixed Meta and Simple Functions (Factory Export)

```js
// admin.actions.js
export default (context) => ({
  admin: {
    impersonate: {
      method: async ({ context, userId, reason }) => {
        // ...impersonate user logic
      },
      meta: { audit: true, requiresAdmin: true }
    },
    getStats: async ({ context }) => {
      // ...get admin stats logic
    },
    listUsers: async ({ context, filter }) => {
      // ...list users logic
    },
    banUser: {
      method: async ({ context, userId }) => {
        // ...ban user logic
      },
      meta: { requiresAdmin: true }
    }
  }
});
```

---

## 5. All Arrow Functions (Factory Export)

```js
// notification.actions.js
export default (context) => ({
  notification: {
    sendEmail: async ({ context, to, subject, body }) => {
      // ...send email logic
    },
    sendSMS: async ({ context, to, message }) => {
      // ...send SMS logic
    },
    markAsRead: async ({ context, notificationId }) => {
      // ...mark notification as read
    },
    listForUser: async ({ context, userId }) => {
      // ...list notifications for user
    }
  }
});
```

---

## 6. All Arrow Functions with Meta (Object Export)

```js
// audit.actions.js
export default {
  audit: {
    logEvent: {
      method: async ({ context, eventType, details }) => {
        // ...log event logic
      },
      meta: { audit: true }
    },
    getLogs: {
      method: async ({ context, filter }) => {
        // ...get logs logic
      },
      meta: { cache: true }
    },
    clearLogs: {
      method: async ({ context }) => {
        // ...clear logs logic
      },
      meta: { requiresAdmin: true }
    },
    exportLogs: {
      method: async ({ context, format }) => {
        // ...export logs logic
      },
      meta: { requiresAdmin: true }
    }
  }
};
```

---

## 7. Standalone Arrow Functions Composed (Factory Export)

```js
// file.actions.js
const uploadFile = async ({ context, fileData }) => {
  // ...upload file logic
};

const getFile = async ({ context, fileId }) => {
  // ...get file logic
};

const listFiles = async ({ context, userId }) => {
  // ...list files for user
};

const deleteFile = async ({ context, fileId }) => {
  // ...delete file logic
};

export default (context) => ({
  file: {
    upload: { method: uploadFile, meta: { audit: true } },
    get: { method: getFile },
    list: { method: listFiles, meta: { cache: true } },
    delete: { method: deleteFile, meta: { requiresAdmin: true } }
  }
});
```

---

## 8. Standalone Arrow Functions Composed (Object Export)

```js
// payment.actions.js
const createPayment = async ({ context, paymentData }) => {
  // ...create payment logic
};

const refundPayment = async ({ context, paymentId, amount }) => {
  // ...refund payment logic
};

const getPaymentStatus = async ({ context, paymentId }) => {
  // ...get payment status logic
};

const listPayments = async ({ context, userId }) => {
  // ...list payments for user
};

export default {
  payment: {
    create: { method: createPayment, meta: { audit: true } },
    refund: { method: refundPayment, meta: { requiresAdmin: true } },
    status: { method: getPaymentStatus },
    list: { method: listPayments, meta: { cache: true } }
  }
};
```

---

## 9. Using withNamespace Utility

```js
// tag.actions.js
// Demonstrates using the withNamespace utility to generate an array of actions
import { withNamespace } from '../utils/with-namespace.js';

const createTag = async ({ context, tagData }) => {
  // ...create tag logic
};

const updateTag = async ({ context, tagId, updates }) => {
  // ...update tag logic
};

const listTags = async ({ context, filter }) => {
  // ...list tags logic
};

const deleteTag = async ({ context, tagId }) => {
  // ...delete tag logic
};

export default withNamespace('tag', {
  create: createTag,
  update: {
    method: updateTag,
    meta: { audit: true }
  },
  list: listTags,
  delete: {
    method: deleteTag,
    meta: { requiresAdmin: true }
  }
});
```

---

## 10. Dynamic Namespace with withNamespace

```js
// dynamic.actions.js
// Demonstrates using a dynamic namespace (e.g., per-tenant or per-feature)
import { withNamespace } from '../utils/with-namespace.js';

const getNamespace = (context) => context.tenant?.slug || 'default';

const createResource = async ({ context, data }) => {
  // ...create resource logic
};

const updateResource = async ({ context, id, updates }) => {
  // ...update resource logic
};

const listResources = async ({ context, filter }) => {
  // ...list resources logic
};

const deleteResource = async ({ context, id }) => {
  // ...delete resource logic
};

export default (context) =>
  withNamespace(getNamespace(context), {
    create: createResource,
    update: updateResource,
    list: listResources,
    delete: {
      method: deleteResource,
      meta: { requiresAdmin: true }
    }
  });
```

---

## 11. Complex Meta for Advanced Behavioral Control

```js
// advanced-meta.actions.js
import { withNamespace } from '../utils/with-namespace.js';

const createSession = async ({ context, userId }) => {
  // ...create session logic
};

const validateSession = async ({ context, sessionId }) => {
  // ...validate session logic
};

const revokeSession = async ({ context, sessionId }) => {
  // ...revoke session logic
};

const listSessions = async ({ context, userId }) => {
  // ...list sessions logic
};

export default withNamespace('session', {
  create: {
    method: createSession,
    meta: {
      audit: { level: 'info', fields: ['userId'] },
      rateLimit: { max: 5, window: '1m' },
      validate: { schema: 'sessionCreateSchema', strict: true }
    }
  },
  validate: {
    method: validateSession,
    meta: {
      cache: { ttl: '2m', key: ({ sessionId }) => `session:${sessionId}` },
      audit: { level: 'debug' }
    }
  },
  revoke: {
    method: revokeSession,
    meta: {
      audit: { level: 'warn', fields: ['sessionId'] },
      requiresAdmin: true,
      retry: 2
    }
  },
  list: {
    method: listSessions,
    meta: {
      cache: { ttl: '30s' },
      requiresAuth: true
    }
  }
});
```

---

**Tips:**
- Use the factory export for best context handling and testability.
- Use metadata (`meta`) for audit, caching, permissions, etc.
- Each action receives a single object argument containing `context` and any other parameters.
- Keep actions focused and small for maintainability. 