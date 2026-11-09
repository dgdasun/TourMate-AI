package com.tourmate.exception;

/** Wrong email or password. Deliberately vague so it doesn't reveal which accounts exist. */
public class AuthException extends RuntimeException {
    public AuthException(String message) {
        super(message);
    }
}
