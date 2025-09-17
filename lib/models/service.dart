import 'dart:convert';

class ServiceRecord {
  final String? id;
  final String vehicleId;
  final ServiceType serviceType;
  final String? customType;
  final String? itemName;
  final double cost;
  final int mileage;
  final String? shop;
  final bool selfService;
  final String? note;
  final List<String> photos;
  final DateTime? date;
  final DateTime? createdAt;

  ServiceRecord({
    this.id,
    required this.vehicleId,
    required this.serviceType,
    this.customType,
    this.itemName,
    required this.cost,
    required this.mileage,
    this.shop,
    this.selfService = false,
    this.note,
    List<String>? photos,
    this.date,
    this.createdAt,
  }) : photos = photos ?? [];

  String get displayType =>
      serviceType == ServiceType.other && customType != null && customType!.isNotEmpty
          ? customType!
          : serviceType.label;

  ServiceRecord copyWith({
    String? id,
    String? vehicleId,
    ServiceType? serviceType,
    String? customType,
    String? itemName,
    double? cost,
    int? mileage,
    String? shop,
    bool? selfService,
    String? note,
    List<String>? photos,
    DateTime? date,
    DateTime? createdAt,
  }) {
    return ServiceRecord(
      id: id ?? this.id,
      vehicleId: vehicleId ?? this.vehicleId,
      serviceType: serviceType ?? this.serviceType,
      customType: customType ?? this.customType,
      itemName: itemName ?? this.itemName,
      cost: cost ?? this.cost,
      mileage: mileage ?? this.mileage,
      shop: shop ?? this.shop,
      selfService: selfService ?? this.selfService,
      note: note ?? this.note,
      photos: photos ?? List.of(this.photos),
      date: date ?? this.date,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toApiMap() {
    return {
      'vehicleId': vehicleId,
      'serviceType': serviceType.apiValue,
      if (customType != null && customType!.isNotEmpty) 'customType': customType,
      if (itemName != null) 'itemName': itemName,
      'cost': cost,
      'mileage': mileage,
      if (shop != null && shop!.isNotEmpty) 'shop': shop,
      if (selfService) 'selfService': true,
      if (note != null) 'note': note,
      'photos': photos,
      if (date != null) 'date': date!.toUtc().toIso8601String(),
    };
  }

  factory ServiceRecord.fromApi(Map<String, dynamic> map) {
    return ServiceRecord(
      id: map['id'] as String?,
      vehicleId: map['vehicleId'] as String,
      serviceType: ServiceTypeX.fromApi(map['serviceType'] as String),
      customType: map['customType'] as String?,
      itemName: map['itemName'] as String?,
      cost: (map['cost'] as num).toDouble(),
      mileage: (map['mileage'] as num).toInt(),
      shop: map['shop'] as String?,
      selfService: map['selfService'] as bool? ?? false,
      note: map['note'] as String?,
      photos: map['photos'] != null
          ? List<String>.from(map['photos'] as List)
          : [],
      date: map['date'] != null
          ? DateTime.tryParse(map['date'] as String)
          : null,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'vehicleId': vehicleId,
        'serviceType': serviceType.apiValue,
        'customType': customType,
        'itemName': itemName,
        'cost': cost,
        'mileage': mileage,
        'shop': shop,
        'selfService': selfService,
        'note': note,
        'photos': photos,
        'date': date?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };

  factory ServiceRecord.fromMap(Map<String, dynamic> map) {
    return ServiceRecord(
      id: map['id'] as String?,
      vehicleId: map['vehicleId'] as String,
      serviceType: ServiceTypeX.fromApi(map['serviceType'] as String),
      customType: map['customType'] as String?,
      itemName: map['itemName'] as String?,
      cost: (map['cost'] as num).toDouble(),
      mileage: (map['mileage'] as num).toInt(),
      shop: map['shop'] as String?,
      selfService: map['selfService'] as bool? ?? false,
      note: map['note'] as String?,
      photos: map['photos'] != null
          ? List<String>.from(map['photos'] as List)
          : [],
      date: map['date'] != null
          ? DateTime.tryParse(map['date'] as String)
          : null,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'] as String)
          : null,
    );
  }

  String toJson() => jsonEncode(toMap());
  factory ServiceRecord.fromJson(String source) =>
      ServiceRecord.fromMap(jsonDecode(source) as Map<String, dynamic>);
}

enum ServiceType {
  airFilter,
  oilFilter,
  fuelFilter,
  cabinFilter,
  motorOil,
  brakePadFront,
  brakePadRear,
  sparkPlug,
  coolant,
  tireChange,
  battery,
  other,
}

extension ServiceTypeX on ServiceType {
  String get label {
    switch (this) {
      case ServiceType.airFilter:
        return 'Air Filter';
      case ServiceType.oilFilter:
        return 'Oil Filter';
      case ServiceType.fuelFilter:
        return 'Fuel Filter';
      case ServiceType.cabinFilter:
        return 'Cabin Filter';
      case ServiceType.motorOil:
        return 'Motor Oil';
      case ServiceType.brakePadFront:
        return 'Brake Pads (Front)';
      case ServiceType.brakePadRear:
        return 'Brake Pads (Rear)';
      case ServiceType.sparkPlug:
        return 'Spark Plugs';
      case ServiceType.coolant:
        return 'Coolant';
      case ServiceType.tireChange:
        return 'Tire Change';
      case ServiceType.battery:
        return 'Battery';
      case ServiceType.other:
        return 'Other';
    }
  }

  String get apiValue {
    switch (this) {
      case ServiceType.airFilter:
        return 'air_filter';
      case ServiceType.oilFilter:
        return 'oil_filter';
      case ServiceType.fuelFilter:
        return 'fuel_filter';
      case ServiceType.cabinFilter:
        return 'cabin_filter';
      case ServiceType.motorOil:
        return 'motor_oil';
      case ServiceType.brakePadFront:
        return 'brake_pad_front';
      case ServiceType.brakePadRear:
        return 'brake_pad_rear';
      case ServiceType.sparkPlug:
        return 'spark_plug';
      case ServiceType.coolant:
        return 'coolant';
      case ServiceType.tireChange:
        return 'tire_change';
      case ServiceType.battery:
        return 'battery';
      case ServiceType.other:
        return 'other';
    }
  }

  static ServiceType fromApi(String value) {
    return ServiceType.values.firstWhere(
        (e) => e.apiValue == value,
        orElse: () => ServiceType.other);
  }
}
