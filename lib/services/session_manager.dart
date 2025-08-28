import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

import '../config.dart';

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

  bool get isLoggedIn => _loggedIn;
  String? get token => _token;
  String? get email => _email;
  String? get name => _name;

  List<Vehicle> get vehicles => List.unmodifiable(_vehicles);
  Vehicle? get defaultVehicle {
    try {
      return _vehicles.firstWhere((v) => v.isDefault);
    } catch (_) {
      return null;
    }
  }

  final _prefs = SharedPreferencesAsync(); // ✅ New API

  Future<void> init() async {
    _token = await _prefs.getString('token');
    _email = await _prefs.getString('email');
    _name = await _prefs.getString('name');
    _loggedIn = _token != null;
    if (_loggedIn) {
      await fetchVehicles();
    }
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
    await fetchVehicles();
    notifyListeners();
  }

  Future<void> logout() async {
    await _prefs.remove('token');
    await _prefs.remove('email');
    await _prefs.remove('name');
    _token = null;
    _email = null;
    _name = null;
    _vehicles.clear();
    _loggedIn = false;
    notifyListeners();
  }

  Map<String, String> _authHeaders() => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<void> fetchVehicles() async {
    try {
      final response = await http.get(
        Uri.parse('$apiBaseUrl/api/v1/vehicles'),
        headers: _authHeaders(),
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        _vehicles = data.map((e) => Vehicle.fromApi(e)).toList();
        notifyListeners();
      }
    } catch (_) {
      // ignore for now
    }
  }

  Future<void> addVehicle(Vehicle vehicle) async {
    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/api/v1/vehicles'),
        headers: _authHeaders(),
        body: jsonEncode(vehicle.toApiMap()),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        _vehicles.add(Vehicle.fromApi(data));
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> updateVehicle(int index, Vehicle vehicle) async {
    final id = _vehicles[index].id;
    if (id == null) return;
    try {
      final response = await http.put(
        Uri.parse('$apiBaseUrl/api/v1/vehicles/$id'),
        headers: _authHeaders(),
        body: jsonEncode(vehicle.toApiMap()),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _vehicles[index] = Vehicle.fromApi(data);
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> removeVehicle(int index) async {
    final id = _vehicles[index].id;
    if (id == null) return;
    try {
      final response = await http.delete(
        Uri.parse('$apiBaseUrl/api/v1/vehicles/$id'),
        headers: _authHeaders(),
      );
      if (response.statusCode == 200 || response.statusCode == 204) {
        _vehicles.removeAt(index);
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> setDefaultVehicle(String? id) async {
    if (id == null) {
      final idx = _vehicles.indexWhere((v) => v.isDefault);
      if (idx != -1) {
        await updateVehicle(idx, _vehicles[idx].copyWith(isDefault: false));
      }
    } else {
      final idx = _vehicles.indexWhere((v) => v.id == id);
      if (idx != -1) {
        await updateVehicle(idx, _vehicles[idx].copyWith(isDefault: true));
      }
    }
    await fetchVehicles();
  }
}

