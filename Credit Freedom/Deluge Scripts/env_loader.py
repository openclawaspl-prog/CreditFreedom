from pathlib import Path


def get_env_value(name, env_path=".env"):
    env_file = Path(__file__).with_name(env_path)

    if not env_file.exists():
        raise RuntimeError(f"{env_path} file was not found.")

    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        if key.strip() == name:
            return value.strip().strip('"').strip("'")

    raise RuntimeError(f"{name} is not set in {env_path}.")
