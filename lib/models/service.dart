import 'dart:convert';

class ServiceRecord {
  final String? id;
  final String vehicleId;
  final String? shop;
  final bool selfService;

  ServiceRecord({
    this.id,
    required this.vehicleId,
    this.shop,
    this.selfService = false,
  });

  Map<String, dynamic> toApiMap() {
    final map = <String, dynamic>{
      'vehicleId': vehicleId,
    };

    if (shop != null && shop!.isNotEmpty) {
      map['shop'] = shop;
    }

    if (selfService) {
      map['selfService'] = true;
    }

    return map;
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'vehicleId': vehicleId,
        'shop': shop,
        'selfService': selfService,
      };

  factory ServiceRecord.fromMap(Map<String, dynamic> map) {
    return ServiceRecord(
      id: map['id'] as String?,
      vehicleId: map['vehicleId'] as String,
      shop: map['shop'] as String?,
      selfService: map['selfService'] as bool? ?? false,
    );
  }

  String toJson() => jsonEncode(toMap());
  factory ServiceRecord.fromJson(String source) =>
      ServiceRecord.fromMap(jsonDecode(source) as Map<String, dynamic>);
}
