import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../models/service.dart';
import '../models/vehicle.dart';
import '../services/session_manager.dart';

enum _ServicePerformer { shop, self }

class AddServiceScreen extends StatefulWidget {
  final ServiceRecord? service;
  final VoidCallback? onSaved;
  final bool standalone;

  AddServiceScreen({this.service, this.onSaved, this.standalone = false});

  @override
  _AddServiceScreenState createState() => _AddServiceScreenState();
}

class _AddServiceScreenState extends State<AddServiceScreen> {
  final _formKey = GlobalKey<FormState>();

  String? _selectedVehicleId;
  ServiceType? _selectedType;
  final TextEditingController _customTypeController = TextEditingController();
  final TextEditingController _itemNameController = TextEditingController();
  final TextEditingController _costController = TextEditingController();
  final TextEditingController _mileageController = TextEditingController();
  final TextEditingController _shopController = TextEditingController();
  _ServicePerformer _performer = _ServicePerformer.shop;
  final TextEditingController _noteController = TextEditingController();
  final List<Uint8List> _photos = [];
  DateTime? _selectedDate;
  final TextEditingController _dateController = TextEditingController();

  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    final session = Provider.of<SessionManager>(context);
    if (widget.service != null) {
      final s = widget.service!;
      _selectedVehicleId = s.vehicleId;
      _selectedType = s.serviceType;
      if (s.customType != null) _customTypeController.text = s.customType!;
      if (s.itemName != null) _itemNameController.text = s.itemName!;
      _costController.text = s.cost.toString();
      _mileageController.text = s.mileage.toString();
      if (s.selfService) {
        _performer = _ServicePerformer.self;
      } else {
        _performer = _ServicePerformer.shop;
        if (s.shop != null) _shopController.text = s.shop!;
      }
      if (s.note != null) _noteController.text = s.note!;
      for (final p in s.photos) {
        try {
          _photos.add(base64Decode(p));
        } catch (_) {}
      }
      _selectedDate = s.date;
      if (s.date != null) {
        _dateController.text = _formatDate(s.date!);
      }
    } else {
      _selectedVehicleId = session.defaultVehicle?.id;
    }
    _initialized = true;
  }

  String _formatDate(DateTime date) {
    final d = date.toLocal();
    return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final session = Provider.of<SessionManager>(context);
    final vehicles = session.vehicles;

    final form = Padding(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              DropdownButtonFormField<String>(
                decoration: InputDecoration(labelText: 'Vehicle'),
                value: _selectedVehicleId,
                items: vehicles
                    .map((vehicle) => DropdownMenuItem(
                          value: vehicle.id,
                          child: Text(vehicle.name),
                        ))
                    .toList(),
                onChanged: (value) => setState(() => _selectedVehicleId = value),
                validator: (value) =>
                    value == null ? 'Please select a vehicle' : null,
              ),
              SizedBox(height: 16),
              DropdownButtonFormField<ServiceType>(
                decoration: InputDecoration(labelText: 'Service Type'),
                value: _selectedType,
                items: ServiceType.values
                    .map((t) => DropdownMenuItem(
                          value: t,
                          child: Text(t.label),
                        ))
                    .toList(),
                onChanged: (value) => setState(() => _selectedType = value),
                validator: (value) =>
                    value == null ? 'Please select a service type' : null,
              ),
              if (_selectedType == ServiceType.other) ...[
                SizedBox(height: 16),
                TextFormField(
                  controller: _customTypeController,
                  decoration: InputDecoration(labelText: 'Custom Type'),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Enter custom type' : null,
                ),
              ],
              SizedBox(height: 16),
              TextFormField(
                controller: _itemNameController,
                decoration: InputDecoration(labelText: 'Item Name'),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _costController,
                decoration: InputDecoration(labelText: 'Cost'),
                keyboardType: TextInputType.number,
                validator: _numberValidator,
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _mileageController,
                decoration: InputDecoration(labelText: 'Mileage'),
                keyboardType: TextInputType.number,
                validator: _numberValidator,
              ),
              SizedBox(height: 16),
              RadioListTile<_ServicePerformer>(
                value: _ServicePerformer.shop,
                groupValue: _performer,
                title: Text('Performed at shop'),
                onChanged: (v) => setState(() => _performer = v!),
              ),
              RadioListTile<_ServicePerformer>(
                value: _ServicePerformer.self,
                groupValue: _performer,
                title: Text('Self Service'),
                onChanged: (v) => setState(() {
                  _performer = v!;
                  _shopController.clear();
                }),
              ),
              if (_performer == _ServicePerformer.shop) ...[
                SizedBox(height: 16),
                TextFormField(
                  controller: _shopController,
                  decoration: InputDecoration(labelText: 'Shop'),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Enter shop name' : null,
                ),
              ],
              SizedBox(height: 16),
              TextFormField(
                controller: _noteController,
                decoration: InputDecoration(labelText: 'Note'),
              ),
              if (_photos.isNotEmpty) ...[
                SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: List.generate(_photos.length, (i) {
                    return Stack(
                      children: [
                        Image.memory(
                          _photos[i],
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                        ),
                        Positioned(
                          right: 0,
                          top: 0,
                          child: GestureDetector(
                            onTap: () => setState(() => _photos.removeAt(i)),
                            child: Container(
                              color: Colors.black54,
                              child: Icon(Icons.close, color: Colors.white, size: 20),
                            ),
                          ),
                        ),
                      ],
                    );
                  }),
                ),
              ],
              SizedBox(height: 16),
              TextButton.icon(
                onPressed: _pickPhoto,
                icon: Icon(Icons.add_a_photo),
                label: Text('Add Photo'),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _dateController,
                decoration: InputDecoration(labelText: 'Date'),
                readOnly: true,
                onTap: () async {
                  final now = DateTime.now();
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate ?? now,
                    firstDate: DateTime(2000),
                    lastDate: DateTime(2100),
                  );
                  if (picked != null) {
                    setState(() {
                      _selectedDate = picked;
                      _dateController.text = _formatDate(picked);
                    });
                  }
                },
                validator: (v) => _selectedDate == null ? 'Select a date' : null,
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: _submitForm,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                child: Text(widget.service == null
                    ? 'Create Service Record'
                    : 'Update Service Record'),
              ),
            ],
          ),
        ),
      ),
    );

    if (widget.standalone) {
      return Scaffold(
        appBar: AppBar(
          title: Text(widget.service == null
              ? 'Add Service Record'
              : 'Edit Service Record'),
        ),
        body: form,
      );
    }
    return form;
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: Icon(Icons.camera_alt),
              title: Text('Take Photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: Icon(Icons.photo_library),
              title: Text('Choose from Gallery'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;
    final file = await picker.pickImage(source: source, imageQuality: 85);
    if (file == null) return;
    var bytes = await file.readAsBytes();
    // Optional compression to keep payload small
    if (bytes.length > 100 * 1024) {
      final decoded = img.decodeImage(bytes);
      if (decoded != null) {
        bytes = Uint8List.fromList(img.encodeJpg(decoded, quality: 80));
      }
    }
    setState(() => _photos.add(bytes));
  }

  String? _numberValidator(String? value) {
    if (value == null || value.isEmpty) return 'This field cannot be empty';
    if (double.tryParse(value) == null) return 'Enter a valid number';
    return null;
  }

  Future<void> _submitForm() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final session = Provider.of<SessionManager>(context, listen: false);
    final service = ServiceRecord(
      id: widget.service?.id,
      vehicleId: _selectedVehicleId!,
      serviceType: _selectedType!,
      customType: _selectedType == ServiceType.other
          ? _customTypeController.text
          : null,
      itemName: _itemNameController.text.isEmpty
          ? null
          : _itemNameController.text,
      cost: double.parse(_costController.text),
      mileage: int.parse(_mileageController.text),
      shop: _performer == _ServicePerformer.shop ? _shopController.text : null,
      selfService: _performer == _ServicePerformer.self,
      note: _noteController.text.isEmpty ? null : _noteController.text,
      photos: _photos.map((b) => base64Encode(b)).toList(),
      date: _selectedDate,
    );

    bool success = false;
    if (widget.service == null) {
      success = await session.addService(service);
    } else if (widget.service!.id != null) {
      success = await session.updateService(widget.service!.id!, service);
    }

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text(success
              ? 'Service record saved successfully!'
              : 'Failed to save service record.')),
    );

    if (success) {
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      } else {
        widget.onSaved?.call();
      }
    }
  }

  @override
  void dispose() {
    _customTypeController.dispose();
    _itemNameController.dispose();
    _costController.dispose();
    _mileageController.dispose();
    _shopController.dispose();
    _noteController.dispose();
    _dateController.dispose();
    super.dispose();
  }
}
