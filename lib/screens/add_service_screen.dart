import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/service.dart';
import '../models/vehicle.dart';
import '../services/session_manager.dart';

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
  bool _selfService = false;
  final TextEditingController _noteController = TextEditingController();
  final List<TextEditingController> _photoControllers = [];
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
      if (s.shop != null) _shopController.text = s.shop!;
      _selfService = s.selfService;
      if (s.note != null) _noteController.text = s.note!;
      for (final p in s.photos) {
        final c = TextEditingController(text: p);
        _photoControllers.add(c);
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
              TextFormField(
                controller: _shopController,
                decoration: InputDecoration(labelText: 'Shop'),
              ),
              SizedBox(height: 16),
              SwitchListTile(
                value: _selfService,
                title: Text('Self Service'),
                onChanged: (v) => setState(() => _selfService = v),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _noteController,
                decoration: InputDecoration(labelText: 'Note'),
              ),
              SizedBox(height: 16),
              ..._buildPhotoFields(),
              TextButton.icon(
                onPressed: () {
                  setState(() {
                    _photoControllers.add(TextEditingController());
                  });
                },
                icon: Icon(Icons.add_a_photo),
                label: Text('Add Photo URL'),
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

  List<Widget> _buildPhotoFields() {
    return List<Widget>.generate(_photoControllers.length, (i) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8.0),
        child: TextFormField(
          controller: _photoControllers[i],
          decoration: InputDecoration(labelText: 'Photo URL ${i + 1}'),
        ),
      );
    });
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
      shop: _shopController.text.isEmpty ? null : _shopController.text,
      selfService: _selfService,
      note: _noteController.text.isEmpty ? null : _noteController.text,
      photos: _photoControllers.map((c) => c.text).where((p) => p.isNotEmpty).toList(),
      date: _selectedDate,
    );

    if (widget.service == null) {
      await session.addService(service);
    } else if (widget.service!.id != null) {
      await session.updateService(widget.service!.id!, service);
    }

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Service record saved successfully!')),
    );

    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    } else {
      widget.onSaved?.call();
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
    for (final c in _photoControllers) {
      c.dispose();
    }
    super.dispose();
  }
}
