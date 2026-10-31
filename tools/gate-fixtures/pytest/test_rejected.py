"""Intentional G8 failure. Not on pytest testpaths."""


def test_rejected_when_the_fixture_is_invoked_directly() -> None:
    raise AssertionError("intentional G8 violation")
