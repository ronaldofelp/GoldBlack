"""
conftest.py — configuração global dos testes pytest.

Seta APP_ENV=test ANTES que qualquer módulo da app seja importado, para que
a validação deny-by-default do JWT_SECRET_KEY permita o segredo de dev
(APP_ENV ∈ _DEV_ENVS). Sem isso, o default 'production' causaria RuntimeError
ao importar app.main em ambiente de teste sem JWT_SECRET_KEY definido.
"""
import os

os.environ.setdefault("APP_ENV", "test")
