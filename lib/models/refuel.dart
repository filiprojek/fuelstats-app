import 'dart:convert';

import 'vehicle.dart';

class Refuel {
  final String? id;
  final String vehicleId;
  final FuelType fuelType;
  final double liters;
  final double pricePerLiter;
  final double totalPrice;
  final int mileage;
  final String? note;
  final DateTime? createdAt;

  Refuel({
    this.id,
    required this.vehicleId,
    required this.fuelType,
    required this.liters,
    required this.pricePerLiter,
    required this.totalPrice,
    required this.mileage,
    this.note,
    this.createdAt,
  });

  Refuel copyWith({
    String? id,
    String? vehicleId,
    FuelType? fuelType,
    double? liters,
    double? pricePerLiter,
    double? totalPrice,
    int? mileage,
    String? note,
    DateTime? createdAt,
  }) {
    return Refuel(
      id: id ?? this.id,
      vehicleId: vehicleId ?? this.vehicleId,
      fuelType: fuelType ?? this.fuelType,
      liters: liters ?? this.liters,
      pricePerLiter: pricePerLiter ?? this.pricePerLiter,
      totalPrice: totalPrice ?? this.totalPrice,
      mileage: mileage ?? this.mileage,
      note: note ?? this.note,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toApiMap() {
    return {
      'vehicleId': vehicleId,
      'fuelType': fuelType.name,
      'note': note,
      'liters': liters,
      'pricePerLiter': pricePerLiter,
      'totalPrice': totalPrice,
      'mileage': mileage,
    };
  }

  factory Refuel.fromApi(Map<String, dynamic> map) {
    return Refuel(
      id: map['id'] as String?,
      vehicleId: map['vehicleId'] as String,
      fuelType:
          FuelType.values.firstWhere((e) => e.name == map['fuelType'] as String),
      note: map['note'] as String?,
      liters: (map['liters'] as num).toDouble(),
      pricePerLiter: (map['pricePerLiter'] as num).toDouble(),
      totalPrice: (map['totalPrice'] as num).toDouble(),
      mileage: (map['mileage'] as num).toInt(),
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'vehicleId': vehicleId,
        'fuelType': fuelType.name,
        'note': note,
        'liters': liters,
        'pricePerLiter': pricePerLiter,
        'totalPrice': totalPrice,
        'mileage': mileage,
        'createdAt': createdAt?.toIso8601String(),
      };

  factory Refuel.fromMap(Map<String, dynamic> map) {
    return Refuel(
      id: map['id'] as String?,
      vehicleId: map['vehicleId'] as String,
      fuelType:
          FuelType.values.firstWhere((e) => e.name == map['fuelType'] as String),
      note: map['note'] as String?,
      liters: (map['liters'] as num).toDouble(),
      pricePerLiter: (map['pricePerLiter'] as num).toDouble(),
      totalPrice: (map['totalPrice'] as num).toDouble(),
      mileage: (map['mileage'] as num).toInt(),
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'] as String)
          : null,
    );
  }

  String toJson() => jsonEncode(toMap());
  factory Refuel.fromJson(String source) =>
      Refuel.fromMap(jsonDecode(source) as Map<String, dynamic>);
}
