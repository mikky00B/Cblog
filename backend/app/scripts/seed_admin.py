import os

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models import Category, User


def main() -> None:
    Base.metadata.create_all(bind=engine)
    email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower().strip()
    password = os.environ.get("ADMIN_PASSWORD", "change-me")

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            db.add(User(email=email, password_hash=hash_password(password), display_name="Admin"))

        for name, slug in [
            ("Engineering", "engineering"),
            ("Backend", "backend"),
            ("Frontend", "frontend"),
            ("DevOps", "devops"),
            ("Web3", "web3"),
            ("Notes", "notes"),
        ]:
            exists = db.scalar(select(Category).where(Category.slug == slug))
            if exists is None:
                db.add(Category(name=name, slug=slug))

        db.commit()
        print(f"Admin ready: {email}")


if __name__ == "__main__":
    main()
