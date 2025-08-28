import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/vehicle.dart';

class SessionManager extends ChangeNotifier {
  static final SessionManager _instance = SessionManager._internal();
  factory SessionManager() => _instance;
  SessionManager._internal();

  bool _loggedIn = false;
  String? _token;
  String? _email;
  String? _name;

  List<Vehicle> _vehicles = [];
  String? _defaultVehicleId;

  bool get isLoggedIn => _loggedIn;
  String? get token => _token;
  String? get email => _email;
  String? get name => _name;

  List<Vehicle> get vehicles => List.unmodifiable(_vehicles);
  Vehicle? get defaultVehicle {
    try {
      return _vehicles.firstWhere((v) => v.id == _defaultVehicleId);
    } catch (_) {
      return null;
    }
  }

  final _prefs = SharedPreferencesAsync(); // ✅ New API

  Future<void> init() async {
    _token = await _prefs.getString('token');
    _email = await _prefs.getString('email');
    _name = await _prefs.getString('name');
    await _loadVehicles();

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
    await _prefs.remove('vehicles');
    await _prefs.remove('defaultVehicleId');

    _token = null;
    _email = null;
    _name = null;
    _vehicles.clear();
    _defaultVehicleId = null;
    _loggedIn = false;
    notifyListeners();
  }

  Future<void> _loadVehicles() async {
    final List<String>? stored = await _prefs.getStringList('vehicles');
    if (stored != null) {
      _vehicles = stored.map((e) => Vehicle.fromJson(e)).toList();
    }
    _defaultVehicleId = await _prefs.getString('defaultVehicleId');
  }

  Future<void> _saveVehicles() async {
    await _prefs.setStringList(
        'vehicles', _vehicles.map((v) => v.toJson()).toList());
    if (_defaultVehicleId != null) {
      await _prefs.setString('defaultVehicleId', _defaultVehicleId!);
    } else {
      await _prefs.remove('defaultVehicleId');
    }
  }

  Future<void> addVehicle(Vehicle vehicle) async {
    _vehicles.add(vehicle);
    await _saveVehicles();
    notifyListeners();
  }

  Future<void> updateVehicle(int index, Vehicle vehicle) async {
    _vehicles[index] = vehicle;
    await _saveVehicles();
    notifyListeners();
  }

  Future<void> removeVehicle(int index) async {
    if (_vehicles[index].id == _defaultVehicleId) {
      _defaultVehicleId = null;
    }
    _vehicles.removeAt(index);
    await _saveVehicles();
    notifyListeners();
  }

  Future<void> setDefaultVehicle(String? id) async {
    _defaultVehicleId = id;
    await _saveVehicles();
    notifyListeners();
  }
}

