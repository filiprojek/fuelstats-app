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
  final String? id;
  final String name;
  final String registrationPlate;
  final FuelType fuelType;
  final String? note;
  final bool isDefault;

  Vehicle({
    this.id,
    required this.name,
    required this.registrationPlate,
    required this.fuelType,
    this.note,
    this.isDefault = false,
  });

  Vehicle copyWith({
    String? id,
    String? name,
    String? registrationPlate,
    FuelType? fuelType,
    String? note,
    bool? isDefault,
  }) {
    return Vehicle(
      id: id ?? this.id,
      name: name ?? this.name,
      registrationPlate: registrationPlate ?? this.registrationPlate,
      fuelType: fuelType ?? this.fuelType,
      note: note ?? this.note,
      isDefault: isDefault ?? this.isDefault,
    );
  }

  Map<String, dynamic> toApiMap() {
    return {
      'name': name,
      'registrationPlate': registrationPlate,
      'fuelType': fuelType.name,
      'note': note,
      'isDefault': isDefault,
    };
  }

  factory Vehicle.fromApi(Map<String, dynamic> map) {
    return Vehicle(
      id: map['id'] as String?,
      name: map['name'] as String,
      registrationPlate: map['registrationPlate'] as String,
      fuelType: FuelType.values
          .firstWhere((e) => e.name == map['fuelType'] as String),
      note: map['note'] as String?,
      isDefault: map['isDefault'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'registrationPlate': registrationPlate,
        'fuelType': fuelType.index,
        'note': note,
        'isDefault': isDefault,
      };

  factory Vehicle.fromMap(Map<String, dynamic> map) {
    return Vehicle(
      id: map['id'] as String?,
      name: map['name'] as String,
      registrationPlate: map['registrationPlate'] as String,
      fuelType: map['fuelType'] is int
          ? FuelTypeX.fromIndex(map['fuelType'] as int)
          : FuelType.values
              .firstWhere((e) => e.name == map['fuelType'] as String),
      note: map['note'] as String?,
      isDefault: map['isDefault'] as bool? ?? false,
    );
  }

  String toJson() => jsonEncode(toMap());
  factory Vehicle.fromJson(String source) => Vehicle.fromMap(jsonDecode(source));
}
