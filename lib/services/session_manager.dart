import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SessionManager extends ChangeNotifier {
  static final SessionManager _instance = SessionManager._internal();
  factory SessionManager() => _instance;
  SessionManager._internal();

  bool _loggedIn = false;
  String? _token;
  String? _email;
  String? _name;

  bool get isLoggedIn => _loggedIn;
  String? get token => _token;
  String? get email => _email;
  String? get name => _name;

  final _prefs = SharedPreferencesAsync(); // ✅ New API

  Future<void> init() async {
    _token = await _prefs.getString('token');
    _email = await _prefs.getString('email');
    _name = await _prefs.getString('name');

    _loggedIn = _token != null;
    notifyListeners();
  }

  Future<void> login({
    required String token,
    required String email,
    String? name,
  }) async {
    await _prefs.setString('token', token);
    await _prefs.setString('email', email);
    if (name != null) await _prefs.setString('name', name);

    _token = token;
    _email = email;
    _name = name;
    _loggedIn = true;
    notifyListeners();
  }

  Future<void> logout() async {
    await _prefs.remove('token');
    await _prefs.remove('email');
    await _prefs.remove('name');

    _token = null;
    _email = null;
    _name = null;
    _loggedIn = false;
    notifyListeners();
  }
}

