import 'dart:convert';

enum FuelType { diesel, gasoline95, gasoline98, other }

extension FuelTypeX on FuelType {
  String get label {
    switch (this) {
      case FuelType.diesel:
        return 'Diesel';
      case FuelType.gasoline95:
        return 'Gasoline 95';
      case FuelType.gasoline98:
        return 'Gasoline 98';
      case FuelType.other:
        return 'Other';
    }
  }

  static FuelType fromIndex(int index) => FuelType.values[index];
}

class Vehicle {
  final String id;
  final String name;
  final String registrationPlate;
  final FuelType fuelType;
  final String? note;

  Vehicle({
    required this.id,
    required this.name,
    required this.registrationPlate,
    required this.fuelType,
    this.note,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'registrationPlate': registrationPlate,
      'fuelType': fuelType.index,
      'note': note,
    };
  }

  factory Vehicle.fromMap(Map<String, dynamic> map) {
    return Vehicle(
      id: map['id'] as String,
      name: map['name'] as String,
      registrationPlate: map['registrationPlate'] as String,
      fuelType: FuelTypeX.fromIndex(map['fuelType'] as int),
      note: map['note'] as String?,
    );
  }

  String toJson() => jsonEncode(toMap());
  factory Vehicle.fromJson(String source) => Vehicle.fromMap(jsonDecode(source));
}
