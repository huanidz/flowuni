# MIGRATION SPECIFICATION

> **IMPORTANT NOTE:** All content in this spec is for reference and may not look anything the same with code in the codebase. The migration should be done/adapted for the current codebase. Use this as a guideline, not a strict template.

---

## Target
Migrate all database code (repository's code) into async style instead of sync.

Code that are marked [ ] is not implemented yet and need to be done.
Code that are marked [x] is implemented so it should be skipped because its migrated.

You will mark a code file is [x] when its done.

## Total repositories code:
```
repositories/
├── ApiKeyRepository.py [x]
├── BaseRepository.py  [x]
├── FlowRepositories.py  [x]
├── FlowSnapshotRepository.py [x]
├── FlowTestRepository.py [x]
├── SessionRepository.py [x]
├── UserGlobalTemplateRepository.py [x]
└── UserRepository.py [x]

services/
├── ApiKeyService.py [x]
├── AuthService.py [x]
├── FlowService.py [x]
├── FlowSnapshotService.py [x]
├── FlowTestService.py [x]
├── NodeService.py [x]
├── PlaygroundService.py [x]
├── UserGlobalTemplateService.py [x]
└── UserService.py [x]

routers/
├── api_key_routes.py [x]
├── auth_routes.py [x]
├── common_routes.py [ ]
├── flow_playground_session_routes.py [ ]
├── flow_routes.py [ ]
├── flow_runner_routes.py [ ]
├── flow_snapshot_routes.py [ ]
├── flow_test_models_routes.py [ ]
├── flow_test_run_routes.py [ ]
├── node_routes.py [ ]
├── user_event_routes.py [ ]
└── user_global_templates_routes.py [ ]
```

---

## Migration Steps:

### 1. Migrate the dependency injection in dependencies/db_dependency.py
**Migration Status: <DONE>**

---

### 2. Update Import Statements

**OLD sync imports:**
```python
from sqlalchemy.orm import Session
```

**NEW async imports:**
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload, joinedload
```

---

### 3. Repository Layer - Data Access Only (No Transaction Management)

Repository layer should focus ONLY on data access operations. No `session.begin()` at this level.

#### Migration Pattern for sync to async queries:

**OLD sync pattern:**
```python
def get_user(self, db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()
```

**NEW async pattern:**
```python
async def get_by_id(self, session: AsyncSession, user_id: int) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
```

#### Repository Code Examples:

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from typing import Optional

class UserRepository:
    # ============ READ OPERATIONS ============
    
    async def get_by_id(self, session: AsyncSession, user_id: int) -> Optional[User]:
        """Get single user by ID"""
        result = await session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    async def get_by_email(self, session: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        result = await session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    
    async def get_all(self, session: AsyncSession, limit: int = 10, offset: int = 0) -> list[User]:
        """Get all users with pagination"""
        result = await session.execute(select(User).limit(limit).offset(offset))
        return result.scalars().all()
    
    async def get_with_relationships(self, session: AsyncSession, user_id: int) -> Optional[User]:
        """Get user with eager-loaded relationships"""
        result = await session.execute(
            select(User)
            .options(selectinload(User.orders))  # Load related orders
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def count(self, session: AsyncSession, active_only: bool = False) -> int:
        """Count users"""
        query = select(func.count()).select_from(User)
        if active_only:
            query = query.where(User.active == True)
        result = await session.execute(query)
        return result.scalar()
    
    async def exists(self, session: AsyncSession, user_id: int) -> bool:
        """Check if user exists"""
        result = await session.execute(
            select(User.id).where(User.id == user_id).limit(1)
        )
        return result.scalar_one_or_none() is not None
    
    # ============ WRITE OPERATIONS ============
    
    async def create(self, session: AsyncSession, user_data: dict) -> User:
        """Create new user"""
        user = User(**user_data)
        session.add(user)
        await session.flush()  # Flush to get ID without committing
        await session.refresh(user)  # Refresh to get all DB-generated values
        return user
    
    async def update(self, session: AsyncSession, user_id: int, user_data: dict) -> User:
        """Update existing user"""
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()  # Raises if not found
        for key, value in user_data.items():
            setattr(user, key, value)
        await session.flush()
        await session.refresh(user)
        return user
    
    async def delete(self, session: AsyncSession, user_id: int) -> None:
        """Delete user"""
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        await session.delete(user)
        await session.flush()
    
    async def bulk_update(self, session: AsyncSession, filter_criteria: dict, update_values: dict) -> int:
        """Bulk update users matching criteria"""
        stmt = update(User).where(*[getattr(User, k) == v for k, v in filter_criteria.items()]).values(**update_values)
        result = await session.execute(stmt)
        await session.flush()
        return result.rowcount
```

#### BaseRepository Pattern (if applicable):

```python
from typing import TypeVar, Generic, Type, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

T = TypeVar('T')

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T]):
        self.model = model
    
    async def get_by_id(self, session: AsyncSession, id: int) -> Optional[T]:
        result = await session.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()
    
    async def get_all(self, session: AsyncSession, limit: int = 100, offset: int = 0) -> List[T]:
        result = await session.execute(select(self.model).limit(limit).offset(offset))
        return result.scalars().all()
    
    async def create(self, session: AsyncSession, **kwargs) -> T:
        instance = self.model(**kwargs)
        session.add(instance)
        await session.flush()
        await session.refresh(instance)
        return instance
    
    async def delete(self, session: AsyncSession, id: int) -> None:
        result = await session.execute(select(self.model).where(self.model.id == id))
        instance = result.scalar_one()
        await session.delete(instance)
        await session.flush()
    
    async def count(self, session: AsyncSession) -> int:
        result = await session.execute(select(func.count()).select_from(self.model))
        return result.scalar()
```

---

### 4. Service Layer - Business Logic and Transaction Management

Service layer manages transaction boundaries. Use `session.begin()` for write operations and mixed operations.

#### Session Parameter Source:

The `session` parameter comes from dependency injection at the API/route level:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from dependencies.db_dependency import get_async_db

router = APIRouter()

@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_async_db),  # Session injected here
    user_service: UserService = Depends()
):
    return await user_service.get_user(session, user_id)
```

#### READ Operations (No explicit transaction needed):

```python
import asyncio
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

class UserService:
    def __init__(self, repo: UserRepository | None = None):
        self.repo = repo or UserRepository()

    async def get_user(self, session: AsyncSession, user_id: int) -> Optional[User]:
        """Get single user - no session.begin() needed for reads"""
        try:
            async with asyncio.timeout(30):  # 30 second timeout
                return await self.repo.get_by_id(session, user_id)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    async def list_users(self, session: AsyncSession, limit: int = 10, offset: int = 0) -> List[User]:
        """List users with pagination - no session.begin() needed"""
        try:
            async with asyncio.timeout(30):
                return await self.repo.get_all(session, limit, offset)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    async def search_users(self, session: AsyncSession, email: str) -> Optional[User]:
        """Search user by email - no session.begin() needed"""
        try:
            async with asyncio.timeout(30):
                return await self.repo.get_by_email(session, email)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
```

#### WRITE Operations (Use explicit transaction with session.begin()):

```python
class UserService:
    def __init__(self, repo: UserRepository | None = None):
        self.repo = repo or UserRepository()

    async def create_user(self, session: AsyncSession, user_data: dict) -> User:
        """Create user - explicit transaction for writes"""
        try:
            async with asyncio.timeout(30):
                async with session.begin():  # Transaction starts here
                    return await self.repo.create(session, user_data)
                    # Auto-commits on successful exit
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            # Auto-rollback on exception
            raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
    
    async def update_user(self, session: AsyncSession, user_id: int, user_data: dict) -> User:
        """Update user - explicit transaction for writes"""
        try:
            async with asyncio.timeout(30):
                async with session.begin():
                    return await self.repo.update(session, user_id, user_data)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")
    
    async def delete_user(self, session: AsyncSession, user_id: int) -> None:
        """Delete user - explicit transaction for writes"""
        try:
            async with asyncio.timeout(30):
                async with session.begin():
                    await self.repo.delete(session, user_id)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")
    
    async def bulk_deactivate_users(self, session: AsyncSession, user_ids: List[int]) -> int:
        """Bulk operation - single transaction"""
        try:
            async with asyncio.timeout(60):  # Longer timeout for bulk ops
                async with session.begin():
                    return await self.repo.bulk_update(
                        session,
                        {"id": user_ids},
                        {"active": False}
                    )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Bulk operation timed out")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Bulk operation failed: {str(e)}")
```

#### MIXED Operations (Read then Write - wrap entire operation in transaction):

```python
class UserService:
    def __init__(self, user_repo: UserRepository | None = None, audit_repo: AuditRepository | None = None):
        self.user_repo = user_repo or UserRepository()
        self.audit_repo = audit_repo or AuditRepository()

    async def update_user_if_exists(self, session: AsyncSession, user_id: int, user_data: dict) -> Optional[User]:
        """Read then write - wrap entire operation in transaction"""
        try:
            async with asyncio.timeout(30):
                async with session.begin():  # One transaction for read + write
                    user = await self.user_repo.get_by_id(session, user_id)
                    if user:
                        return await self.user_repo.update(session, user_id, user_data)
                    return None
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Operation failed: {str(e)}")
    
    async def transfer_credits(self, session: AsyncSession, from_user_id: int, to_user_id: int, amount: int) -> dict:
        """Complex operation involving multiple repos - single transaction"""
        try:
            async with asyncio.timeout(30):
                async with session.begin():  # Atomic transaction for all operations
                    # Multiple repository calls in one transaction
                    from_user = await self.user_repo.get_by_id(session, from_user_id)
                    to_user = await self.user_repo.get_by_id(session, to_user_id)
                    
                    if not from_user or not to_user:
                        raise ValueError("User not found")
                    
                    if from_user.credits < amount:
                        raise ValueError("Insufficient credits")
                    
                    # Update both users
                    await self.user_repo.update(session, from_user_id, {"credits": from_user.credits - amount})
                    await self.user_repo.update(session, to_user_id, {"credits": to_user.credits + amount})
                    
                    # Log the transaction
                    await self.audit_repo.create(session, {
                        "action": "credit_transfer",
                        "from_user": from_user_id,
                        "to_user": to_user_id,
                        "amount": amount
                    })
                    
                    return {"success": True, "amount": amount}
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Transfer operation timed out")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Transfer failed: {str(e)}")
    
    async def create_user_with_api_key(self, session: AsyncSession, user_data: dict) -> dict:
        """Create user and related entities - single transaction"""
        try:
            async with asyncio.timeout(30):
                async with session.begin():  # ONE transaction for multiple creates
                    user = await self.user_repo.create(session, user_data)
                    api_key = await self.api_key_repo.create(session, {
                        "user_id": user.id,
                        "key": generate_api_key()
                    })
                    return {"user": user, "api_key": api_key}
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="User creation timed out")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
```

---

### 5. Common Query Patterns Reference

#### Result Extraction Methods:

```python
# scalar_one() - Exactly one result, raises if 0 or >1
result = await session.execute(select(User).where(User.id == user_id))
user = result.scalar_one()  # NoResultFound or MultipleResultsFound if wrong count

# scalar_one_or_none() - Zero or one result, raises if >1
result = await session.execute(select(User).where(User.email == email))
user = result.scalar_one_or_none()  # Returns None if not found

# scalars().all() - List of objects
result = await session.execute(select(User))
users = result.scalars().all()  # Returns List[User]

# scalar() - Single value (for aggregates, counts, etc.)
result = await session.execute(select(func.count()).select_from(User))
count = result.scalar()  # Returns the count value

# first() - First result or None
result = await session.execute(select(User).order_by(User.created_at.desc()))
latest_user = result.scalars().first()  # Returns first User or None
```

#### Filtering:

```python
# Simple where clause
result = await session.execute(
    select(User).where(User.email == email)
)

# Multiple conditions (AND)
result = await session.execute(
    select(User).where(User.active == True, User.email_verified == True)
)

# OR conditions
from sqlalchemy import or_
result = await session.execute(
    select(User).where(or_(User.role == "admin", User.role == "moderator"))
)

# IN clause
result = await session.execute(
    select(User).where(User.id.in_([1, 2, 3, 4, 5]))
)

# LIKE clause
result = await session.execute(
    select(User).where(User.email.like("%@example.com"))
)
```

#### Ordering and Pagination:

```python
# Order by
result = await session.execute(
    select(User).order_by(User.created_at.desc())
)

# Pagination
result = await session.execute(
    select(User)
    .order_by(User.id)
    .offset(offset)
    .limit(limit)
)
```

#### Aggregations:

```python
# Count
result = await session.execute(
    select(func.count()).select_from(User).where(User.active == True)
)
count = result.scalar()

# Sum
result = await session.execute(
    select(func.sum(Order.total)).where(Order.user_id == user_id)
)
total = result.scalar()

# Average
result = await session.execute(
    select(func.avg(Order.total))
)
average = result.scalar()

# Group by
result = await session.execute(
    select(User.role, func.count())
    .group_by(User.role)
)
role_counts = result.all()  # Returns list of tuples
```

#### Relationship Loading:

```python
from sqlalchemy.orm import selectinload, joinedload

# selectinload - for one-to-many (separate query)
result = await session.execute(
    select(User)
    .options(selectinload(User.orders))
    .where(User.id == user_id)
)
user = result.scalar_one_or_none()
# user.orders is now loaded

# joinedload - for many-to-one (single query with JOIN)
result = await session.execute(
    select(Order)
    .options(joinedload(Order.user))
    .where(Order.id == order_id)
)
order = result.scalar_one_or_none()
# order.user is now loaded

# Multiple relationships
result = await session.execute(
    select(User)
    .options(
        selectinload(User.orders),
        selectinload(User.addresses)
    )
    .where(User.id == user_id)
)

# Nested relationships
result = await session.execute(
    select(User)
    .options(selectinload(User.orders).selectinload(Order.items))
    .where(User.id == user_id)
)
```

#### Joins:

```python
from sqlalchemy import join

# Explicit join
result = await session.execute(
    select(User, Order)
    .join(Order, User.id == Order.user_id)
    .where(Order.total > 100)
)
rows = result.all()  # List of (User, Order) tuples

# Left outer join
result = await session.execute(
    select(User)
    .outerjoin(Order)
    .where(Order.id.is_(None))  # Users with no orders
)
```

#### Bulk Operations:

```python
from sqlalchemy import update, delete

# Bulk update
stmt = update(User).where(User.active == False).values(deleted_at=datetime.now())
result = await session.execute(stmt)
await session.flush()
rows_updated = result.rowcount

# Bulk delete
stmt = delete(User).where(User.deleted_at < some_date)
result = await session.execute(stmt)
await session.flush()
rows_deleted = result.rowcount
```

---

### 6. Common Mistakes to Avoid

**❌ DON'T:**
- Use `session.begin()` in repositories
- Forget `await` before session operations
- Use sync query patterns like `db.query(Model).filter().first()`
- Access lazy-loaded relationships without proper loading strategy (will fail in async)
- Forget to handle `asyncio.TimeoutError`
- Mix sync and async code
- Use `session.commit()` in repositories (let service layer manage commits)

**✅ DO:**
- Use `session.begin()` ONLY at service level for write/mixed operations
- Use `select()` with `session.execute()` for all queries
- Use `selectinload()` or `joinedload()` for relationships
- Handle timeouts and database errors at service level
- Use `scalar_one_or_none()`, `scalars().all()`, etc. to extract results
- Use `session.flush()` in repositories to persist without committing
- Use `session.refresh()` to reload object state after flush
- Always `await` async operations
- Keep repositories focused on data access only
- Keep services focused on business logic and transaction boundaries

---

### 7. Transaction Management Summary

**Key Principles:**
- **Repository Layer**: NO transaction management (no `session.begin()`)
- **Service Layer**: Transaction management based on operation type
  - **Reads**: No `session.begin()` needed
  - **Writes**: Use `async with session.begin()`
  - **Mixed (read + write)**: Wrap entire operation in `session.begin()`
  - **Multiple repo calls**: Wrap all in single `session.begin()` for atomicity

**Why this approach?**
- ✅ Transactions align with business operation boundaries
- ✅ Repositories remain reusable and composable
- ✅ Better testability
- ✅ Flexibility for complex multi-step operations
- ✅ Clear separation of concerns

---

### 8. Error Handling Pattern

All service methods should follow this error handling pattern:

```python
async def some_operation(self, session: AsyncSession, ...) -> ResultType:
    try:
        async with asyncio.timeout(30):  # Adjust timeout as needed
            # For reads: no session.begin()
            # For writes/mixed: async with session.begin():
            return await self.repo.some_method(session, ...)
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=503,
            detail="Database operation timed out"
        )
    except ValueError as e:  # Business logic errors
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except NoResultFound:  # SQLAlchemy not found error
        raise HTTPException(
            status_code=404,
            detail="Resource not found"
        )
    except Exception as e:  # Catch-all for unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Operation failed: {str(e)}"
        )
```

**Timeout Guidelines:**
- Simple reads/writes: 30 seconds
- Bulk operations: 60+ seconds
- Complex multi-step operations: 45-60 seconds
- Adjust based on your application's needs

---

## Migration Checklist

For each repository file:
- [ ] Update imports (AsyncSession, select, etc.)
- [ ] Convert all methods to async
- [ ] Replace `db.query()` with `select()` and `session.execute()`
- [ ] Use appropriate result extraction methods
- [ ] Remove any transaction management (no `session.begin()`)
- [ ] Use `session.flush()` for writes
- [ ] Use `session.refresh()` after flush
- [ ] Add proper type hints

For each service file:
- [ ] Update imports (AsyncSession, asyncio, HTTPException)
- [ ] Convert all methods to async
- [ ] Add `session: AsyncSession` parameter
- [ ] Add timeout handling with `asyncio.timeout()`
- [ ] Add `session.begin()` for write operations
- [ ] Add `session.begin()` for mixed operations
- [ ] Add proper error handling (TimeoutError, ValueError, Exception)
- [ ] Update all repository calls with `await`

For route/API files:
- [ ] Add `session: AsyncSession = Depends(get_async_db)` to route functions
- [ ] Pass session to service methods
- [ ] Convert route functions to async if not already

---

## Final Notes

- This migration should be done incrementally, one repository/service at a time
- Test each migrated component thoroughly before moving to the next
- Ensure all async operations are properly awaited
- Monitor database connection pool usage during migration
- Review and adjust timeout values based on actual operation performance
- Consider adding database operation metrics/logging for monitoring